import React, { useState } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import {
  Button, Typography, Box, Avatar, TextField, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, TablePagination, TableSortLabel, Paper, Tooltip
} from '@mui/material';

interface GoogleUser {
  name: string;
  email: string;
  picture?: string;
}

interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
  threadId?: string;
}

type Order = 'asc' | 'desc';

const GoogleLoginButton: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GmailMessage[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof GmailMessage>('snippet');

  function parseJwt(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return {};
    }
  }

  // Use the useGoogleLogin hook for OAuth with scopes
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setToken(tokenResponse.access_token);
      // Try People API first
      try {
        const res = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const data = await res.json();
        if (data.names && data.emailAddresses) {
          setUser({
            name: data.names[0].displayName,
            email: data.emailAddresses[0].value,
            picture: undefined,
          });
          return;
        }
      } catch (e) {
        // fallback below
      }
      // Fallback: Try to decode id_token if available
      if ((tokenResponse as any).id_token) {
        const decoded = parseJwt((tokenResponse as any).id_token);
        setUser({
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture
        });
        return;
      }
      // If all else fails
      setUser({ name: 'Unknown User', email: '' });
    },
    scope: 'openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly',
    flow: 'implicit',
  });

  const handleLogout = () => {
    googleLogout();
    setUser(null);
    setToken(null);
    setResults([]);
    setSearch('');
    setPage(0);
  };

  const handleSearch = async () => {
    if (!token || !search) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        // Fetch details for each message
        const details = await Promise.all(
          data.messages.slice(0, 50).map(async (msg: any) => {
            const msgRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const msgData = await msgRes.json();
            let subject = '';
            let from = '';
            let date = '';
            if (msgData.payload && msgData.payload.headers) {
              for (const h of msgData.payload.headers) {
                if (h.name === 'Subject') subject = h.value;
                if (h.name === 'From') from = h.value;
                if (h.name === 'Date') date = h.value;
              }
            }
            return {
              id: msg.id,
              threadId: msgData.threadId,
              snippet: msgData.snippet || '',
              subject,
              from,
              date,
            };
          })
        );
        // Only show rows with at least a subject or snippet
        setResults(details.filter(d => d.subject || d.snippet));
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    }
    setLoading(false);
    setPage(0);
  };

  // Sorting logic
  const handleRequestSort = (property: keyof GmailMessage) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const sortedResults = results.slice().sort((a, b) => {
    const aSnippet = a.snippet || '';
    const bSnippet = b.snippet || '';
    const aSubject = a.subject || '';
    const bSubject = b.subject || '';
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    if (orderBy === 'snippet') {
      return order === 'asc'
        ? aSnippet.localeCompare(bSnippet)
        : bSnippet.localeCompare(aSnippet);
    }
    if (orderBy === 'subject') {
      return order === 'asc'
        ? aSubject.localeCompare(bSubject)
        : bSubject.localeCompare(aSubject);
    }
    if (orderBy === 'date') {
      return order === 'asc' ? aDate - bDate : bDate - aDate;
    }
    return 0;
  });

  // Pagination logic
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  function extractEmail(from: string = ''): string {
    const match = from.match(/<([^>]+)>/);
    if (match) return match[1];
    // fallback: if no <...>, try to find an email
    const emailMatch = from.match(/[\w.-]+@[\w.-]+/);
    return emailMatch ? emailMatch[0] : from;
  }

  function formatDate(dateStr: string = ''): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const mmddyyyy = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
    const hhmm = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    return `${mmddyyyy} ${hhmm}`;
  }

  function decodeSnippet(snippet: string = ''): string {
    // decode basic HTML entities
    const txt = document.createElement('textarea');
    txt.innerHTML = snippet;
    return txt.value;
  }

  function truncate(str: string, n: number): string {
    return str.length > n ? str.slice(0, n - 1) + '…' : str;
  }

  return (
    <Box sx={{ mt: 4 }}>
      {user ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Avatar src={user.picture} alt={user.name} sx={{ width: 64, height: 64 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{user.name}</Typography>
          {user.email && (
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500, mb: 1 }}>{user.email}</Typography>
          )}
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
          <Box mt={2} width="100%" maxWidth={400}>
            <TextField
              fullWidth
              label="Search Gmail"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              disabled={loading}
            />
            <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 700, color: 'orange' }}>
              Enter keywords to search your Gmail messages (e.g., subject, sender, or content).
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ mt: 2 }}
              disabled={loading || !search}
            >
              Search
            </Button>
          </Box>
          {loading && <CircularProgress sx={{ mt: 2 }} />}
          {results.length > 0 && (
            <Paper sx={{ mt: 2, width: '100%', maxWidth: 800 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sortDirection={orderBy === 'subject' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'subject'}
                        direction={orderBy === 'subject' ? order : 'asc'}
                        onClick={() => handleRequestSort('subject')}
                      >
                        Subject
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>From</TableCell>
                    <TableCell sortDirection={orderBy === 'date' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'date'}
                        direction={orderBy === 'date' ? order : 'asc'}
                        onClick={() => handleRequestSort('date')}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sortDirection={orderBy === 'snippet' ? order : false}>
                      <TableSortLabel
                        active={orderBy === 'snippet'}
                        direction={orderBy === 'snippet' ? order : 'asc'}
                        onClick={() => handleRequestSort('snippet')}
                      >
                        Snippet
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedResults.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((msg, idx) => (
                    <TableRow key={msg.id} sx={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#fff', '&:hover': { backgroundColor: '#f0f4ff' } }}>
                      <TableCell>
                        {msg.subject ? (
                          <a
                            href={`https://mail.google.com/mail/u/0/#inbox/${msg.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 500 }}
                          >
                            {msg.subject}
                          </a>
                        ) : ''}
                      </TableCell>
                      <TableCell>{extractEmail(msg.from)}</TableCell>
                      <TableCell>{formatDate(msg.date)}</TableCell>
                      <Tooltip title={decodeSnippet(msg.snippet)} placement="top" arrow>
                        <TableCell>{truncate(decodeSnippet(msg.snippet), 80)}</TableCell>
                      </Tooltip>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={results.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Paper>
          )}
          {!loading && results.length === 0 && search && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No results found.
            </Typography>
          )}
        </Box>
      ) : (
        <Button variant="contained" color="primary" onClick={() => login()}>
          Sign in with Google
        </Button>
      )}
    </Box>
  );
};

export default GoogleLoginButton; 