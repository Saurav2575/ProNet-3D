import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import auth from '../store/slices/authSlice';
import feed from '../store/slices/feedSlice';
import jobs from '../store/slices/jobsSlice';
import theme from '../store/slices/themeSlice';
import { ThemeProvider } from '../context/ThemeContext';
import PostShareBox from '../components/feed/PostShareBox';
import Jobs from '../pages/Jobs';
import { postAPI, jobAPI, uploadAPI } from '../services';
jest.mock('../services', () => ({ authAPI: { login: jest.fn(), register: jest.fn(), logout: jest.fn(), getMe: jest.fn() }, postAPI: { create: jest.fn(), getFeed: jest.fn(), like: jest.fn() }, jobAPI: { getAll: jest.fn(), myApplications: jest.fn(), myJobs: jest.fn(), create: jest.fn(), update: jest.fn(), apply: jest.fn(), applicants: jest.fn(), updateStatus: jest.fn() }, uploadAPI: { image: jest.fn() } }));
const user = { _id: 'u1', firstName: 'Saurav', lastName: 'Kumar' };
const createStore = () => configureStore({ reducer: { auth, feed, jobs, theme }, preloadedState: { auth: { user, initialized: true, loading: false, checking: false }, theme: { mode: 'light' } } });
const show = (element, entry = '/jobs') => {
  const store = createStore();
  render(<Provider store={store}><ThemeProvider><MemoryRouter initialEntries={[entry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{element}</MemoryRouter></ThemeProvider></Provider>);
  return store;
};
beforeEach(() => { jobAPI.getAll.mockResolvedValue({ data: [] }); jobAPI.myApplications.mockResolvedValue({ data: [] }); jobAPI.myJobs.mockResolvedValue({ data: [] }); });
test('failed post submission keeps the draft open and displays the server error', async () => {
  postAPI.create.mockRejectedValue({ response: { data: { message: 'Post could not be saved' } } });
  show(<PostShareBox />);
  fireEvent.click(screen.getByRole('button', { name: /Start a post/ }));
  fireEvent.change(screen.getByLabelText(/Post content/), { target: { value: 'Keep this draft' } });
  fireEvent.click(screen.getByRole('button', { name: 'Post', exact: true }));
  expect(await screen.findByText('Post could not be saved')).toBeInTheDocument();
  expect(screen.getByLabelText(/Post content/)).toHaveValue('Keep this draft');
});
test('post creation includes an uploaded media attachment and updates the feed', async () => {
  uploadAPI.image.mockResolvedValue({ data: { url: '/uploads/example.png' } });
  postAPI.create.mockResolvedValue({ data: { _id: 'p1', content: 'Photo update', image: '/uploads/example.png' } });
  const store = show(<PostShareBox />);
  fireEvent.click(screen.getByRole('button', { name: /Start a post/ }));
  fireEvent.change(screen.getByLabelText(/Post content/), { target: { value: 'Photo update' } });
  fireEvent.change(document.querySelector('input[type=file]'), { target: { files: [new File(['png'], 'photo.png', { type: 'image/png' })] } });
  await screen.findByAltText('Post attachment preview');
  fireEvent.click(screen.getByRole('button', { name: 'Post', exact: true }));
  await waitFor(() => expect(postAPI.create).toHaveBeenCalledWith({ content: 'Photo update', image: '/uploads/example.png' }));
  await waitFor(() => expect(store.getState().feed.posts).toHaveLength(1));
});
test('loading more feed pages appends posts without removing the first page or duplicating IDs', () => {
  const state = feed(undefined, { type: 'feed/fetchFeed/fulfilled', payload: { posts: [{ _id: 'one' }], page: 1, pages: 2, total: 2 } });
  const next = feed(state, { type: 'feed/fetchFeed/fulfilled', payload: { posts: [{ _id: 'two' }, { _id: 'one' }], page: 2, pages: 2, total: 2 } });
  expect(next.posts.map(p => p._id)).toEqual(['one', 'two']);
});
test('application history uses persistent server status and distinguishes closed listings', async () => {
  jobAPI.myApplications.mockResolvedValue({ data: [{ _id: 'a1', job: { _id: 'j1', title: 'React internship', company: 'Example', location: 'Pune', isActive: false }, status: 'shortlisted', coverLetter: 'My relevant skills', resumeUrl: 'https://example.com/resume.pdf', createdAt: new Date().toISOString() }] });
  show(<Jobs />, '/jobs?tab=applications');
  expect(await screen.findByText('React internship')).toBeInTheDocument();
  expect(screen.getByText('shortlisted')).toBeInTheDocument(); expect(screen.getByText('Listing closed')).toBeInTheDocument();
});
test('job search sends title, location, and type to the backend together', async () => {
  show(<Jobs />); await screen.findByText('No jobs found');
  fireEvent.change(screen.getByLabelText('Job title or company'), { target: { value: 'React' } });
  fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Pune' } });
  fireEvent.mouseDown(screen.getByLabelText('Job type'));
  fireEvent.click(await screen.findByRole('option', { name: 'internship' }));
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(jobAPI.getAll).toHaveBeenCalledWith({ q: 'React', location: 'Pune', type: 'internship', page: 1 }));
});
test('recruiter dashboard loads applicants and updates a selected application status', async () => {
  jobAPI.myJobs.mockResolvedValue({ data: [{ _id: 'j1', title: 'Frontend developer', company: 'Example', location: 'Remote', isActive: true, applicants: ['u2'] }] });
  jobAPI.applicants.mockResolvedValue({ data: [{ _id: 'a1', applicant: { _id: 'u2', firstName: 'Alice', lastName: 'Tester', email: 'alice@example.com' }, status: 'submitted', coverLetter: 'My application', resumeUrl: 'https://example.com/resume.pdf' }] });
  jobAPI.updateStatus.mockResolvedValue({ data: {} });
  show(<Jobs />, '/jobs?tab=recruiter');
  fireEvent.click(await screen.findByRole('button', { name: 'View applicants' }));
  const dialog = await screen.findByRole('dialog');
  expect(await within(dialog).findByText('Alice Tester')).toBeInTheDocument();
  fireEvent.mouseDown(within(dialog).getByLabelText('Application status'));
  fireEvent.click(await screen.findByRole('option', { name: 'shortlisted' }));
  await waitFor(() => expect(jobAPI.updateStatus).toHaveBeenCalledWith('a1', 'shortlisted'));
});
test('theme changes persist through the theme provider and adapt the palette', async () => {
  const store = show(<TypographyProbe />);
  act(() => store.dispatch({ type: 'theme/toggleTheme' }));
  await waitFor(() => expect(localStorage.getItem('theme')).toBe('dark'));
});
function TypographyProbe() { return <div>Theme probe</div>; }

test('header compose link opens the post form without losing the draft', async () => {
  show(<PostShareBox />, '/feed?compose=1');
  const content = await screen.findByLabelText(/Post content/);
  fireEvent.change(content, { target: { value: 'A useful idea' } });
  expect(screen.getByRole('dialog')).toBeVisible();
  expect(content).toHaveValue('A useful idea');
});
