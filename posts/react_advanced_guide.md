# React Nâng Cao - Hướng Dẫn Chi Tiết

## 1. Hooks Nâng Cao

### 1.1. useReducer

`useReducer` là một alternative của `useState` cho việc quản lý state phức tạp với nhiều sub-values hoặc khi state tiếp theo phụ thuộc vào state trước đó.

**Cú pháp:**
```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```

**Ví dụ - Todo App:**
```javascript
import { useReducer } from 'react';

const initialState = { todos: [], count: 0 };

function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        todos: [...state.todos, { id: Date.now(), text: action.payload }],
        count: state.count + 1
      };
    case 'REMOVE_TODO':
      return {
        todos: state.todos.filter(todo => todo.id !== action.payload),
        count: state.count - 1
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? { ...todo, completed: !todo.completed }
            : todo
        )
      };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  const addTodo = (text) => {
    dispatch({ type: 'ADD_TODO', payload: text });
  };

  return (
    <div>
      <h2>Total: {state.count}</h2>
      {state.todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  );
}
```

**Khi nào dùng useReducer:**
- State có cấu trúc phức tạp (nested objects)
- Logic cập nhật state phức tạp
- Cần test logic độc lập
- State transitions có nhiều actions

---

### 1.2. useCallback và useMemo

**useCallback**: Memoize functions để tránh tạo lại function mỗi lần render.

```javascript
import { useCallback, useState } from 'react';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Function được memoize, chỉ tạo lại khi query thay đổi
  const handleSearch = useCallback(async () => {
    const data = await fetch(`/api/search?q=${query}`);
    setResults(await data.json());
  }, [query]);

  return <SearchResults onSearch={handleSearch} />;
}
```

**useMemo**: Memoize giá trị tính toán để tránh tính toán lại không cần thiết.

```javascript
import { useMemo, useState } from 'react';

function ExpensiveComponent({ items }) {
  const [filter, setFilter] = useState('');

  // Chỉ filter lại khi items hoặc filter thay đổi
  const filteredItems = useMemo(() => {
    console.log('Filtering...');
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Tính toán phức tạp
  const statistics = useMemo(() => {
    return {
      total: filteredItems.length,
      average: filteredItems.reduce((sum, item) => sum + item.price, 0) / filteredItems.length
    };
  }, [filteredItems]);

  return (
    <div>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <p>Total: {statistics.total}, Average: {statistics.average}</p>
    </div>
  );
}
```

**Best Practices:**
- Không lạm dụng, chỉ dùng khi cần thiết
- Profile trước khi optimize
- Dependencies array phải chính xác

---

### 1.3. useRef

`useRef` trả về một mutable ref object có thuộc tính `.current` được khởi tạo với giá trị truyền vào. Object này tồn tại suốt lifetime của component.

**Use Case 1: Truy cập DOM Elements**
```javascript
import { useRef, useEffect } from 'react';

function FocusInput() {
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus vào input khi component mount
    inputRef.current.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
}
```

**Use Case 2: Lưu giá trị không trigger re-render**
```javascript
function Timer() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setCount(c => c + 1);
    }, 1000);
  };

  const stopTimer = () => {
    clearInterval(intervalRef.current);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
}
```

**Use Case 3: Lưu giá trị previous**
```javascript
function usePrevious(value) {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

function Counter() {
  const [count, setCount] = useState(0);
  const prevCount = usePrevious(count);

  return (
    <div>
      <p>Current: {count}, Previous: {prevCount}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

---

### 1.4. useImperativeHandle

Tùy chỉnh instance value được expose cho parent component khi dùng `ref`.

```javascript
import { forwardRef, useImperativeHandle, useRef } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef();

  // Expose custom methods cho parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
    clear: () => {
      inputRef.current.value = '';
    },
    getValue: () => {
      return inputRef.current.value;
    }
  }));

  return <input ref={inputRef} {...props} />;
});

// Parent component
function Form() {
  const inputRef = useRef();

  const handleSubmit = () => {
    console.log(inputRef.current.getValue());
    inputRef.current.clear();
  };

  return (
    <div>
      <CustomInput ref={inputRef} />
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={() => inputRef.current.focus()}>Focus</button>
    </div>
  );
}
```

---

### 1.5. useLayoutEffect

Giống `useEffect` nhưng chạy **synchronously** sau tất cả DOM mutations, trước khi browser paint.

**Khi nào dùng:**
- Đo lường DOM (getBoundingClientRect)
- Cập nhật DOM trước khi paint để tránh flicker

```javascript
import { useLayoutEffect, useRef, useState } from 'react';

function Tooltip({ children, text }) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef();

  useLayoutEffect(() => {
    const rect = tooltipRef.current.getBoundingClientRect();
    
    // Điều chỉnh vị trí tooltip để không bị cắt
    let x = coords.x;
    let y = coords.y;
    
    if (x + rect.width > window.innerWidth) {
      x = window.innerWidth - rect.width;
    }
    
    setCoords({ x, y });
  }, [coords.x, coords.y]);

  return (
    <div>
      {children}
      <div ref={tooltipRef} style={{ position: 'absolute', left: coords.x, top: coords.y }}>
        {text}
      </div>
    </div>
  );
}
```

---

### 1.6. Custom Hooks

Custom hooks cho phép extract component logic thành reusable functions.

**Ví dụ 1: useFetch**
```javascript
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}

// Sử dụng
function UserProfile({ userId }) {
  const { data, loading, error } = useFetch(`/api/users/${userId}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data.name}</div>;
}
```

**Ví dụ 2: useLocalStorage**
```javascript
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

// Sử dụng
function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

**Ví dụ 3: useDebounce**
```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Sử dụng
function SearchBox() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Gọi API search
      console.log('Searching for:', debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

---

## 2. Performance Optimization

### 2.1. React.memo

`React.memo` là Higher Order Component giúp memoize component, chỉ re-render khi props thay đổi.

```javascript
import { memo } from 'react';

// Component con expensive
const ExpensiveChild = memo(({ data, onUpdate }) => {
  console.log('ExpensiveChild rendered');
  
  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
});

// Custom comparison function
const UserCard = memo(
  ({ user, onClick }) => {
    return (
      <div onClick={onClick}>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Return true nếu props giống nhau (skip render)
    return prevProps.user.id === nextProps.user.id;
  }
);
```

**Lưu ý:**
- Chỉ dùng khi component render expensive
- Không hiệu quả nếu props thay đổi thường xuyên
- Shallow comparison mặc định

---

### 2.2. Code Splitting

**React.lazy và Suspense:**
```javascript
import { lazy, Suspense } from 'react';

// Lazy load component
const HeavyComponent = lazy(() => import('./HeavyComponent'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

**Route-based Code Splitting:**
```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**Preload Components:**
```javascript
const OtherComponent = lazy(() => import('./OtherComponent'));

// Preload khi hover
function Button() {
  const preload = () => {
    import('./OtherComponent');
  };

  return (
    <button onMouseEnter={preload}>
      Show Other Component
    </button>
  );
}
```

---

### 2.3. Virtualization

Render chỉ những items hiển thị trên viewport, cải thiện performance với danh sách lớn.

**Với react-window:**
```javascript
import { FixedSizeList } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>
    Row {index}
  </div>
);

function VirtualList() {
  return (
    <FixedSizeList
      height={600}
      itemCount={10000}
      itemSize={35}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

**Variable Size List:**
```javascript
import { VariableSizeList } from 'react-window';

const rowHeights = new Array(1000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 50));

const getItemSize = index => rowHeights[index];

function VariableList() {
  return (
    <VariableSizeList
      height={600}
      itemCount={1000}
      itemSize={getItemSize}
      width="100%"
    >
      {Row}
    </VariableSizeList>
  );
}
```

---

### 2.4. Profiling

**React DevTools Profiler:**
```javascript
import { Profiler } from 'react';

function onRenderCallback(
  id, // "id" của Profiler tree vừa commit
  phase, // "mount" hoặc "update"
  actualDuration, // thời gian render commit
  baseDuration, // thời gian render ước tính không có memoization
  startTime, // khi React bắt đầu render
  commitTime, // khi React commit update
  interactions // Set các interactions thuộc về update này
) {
  console.log(`${id}'s ${phase} phase:`);
  console.log(`Actual time: ${actualDuration}`);
  console.log(`Base time: ${baseDuration}`);
}

function App() {
  return (
    <Profiler id="Navigation" onRender={onRenderCallback}>
      <Navigation />
    </Profiler>
  );
}
```

---

## 3. Context API và State Management

### 3.1. Context API

**Basic Context:**
```javascript
import { createContext, useContext, useState } from 'react';

// Tạo context
const ThemeContext = createContext();

// Provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook để dùng context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Sử dụng
function ThemedButton() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      style={{ background: theme === 'light' ? '#fff' : '#333' }}
    >
      Toggle Theme
    </button>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

**Multiple Contexts:**
```javascript
const AuthContext = createContext();
const ThemeContext = createContext();

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

// Combine contexts
function AppContent() {
  const { user } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);

  return <div>Welcome {user.name} - Theme: {theme}</div>;
}
```

**Context với useReducer:**
```javascript
const TodoContext = createContext();

const initialState = { todos: [] };

function todoReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { todos: [...state.todos, action.payload] };
    case 'REMOVE':
      return { todos: state.todos.filter(t => t.id !== action.payload) };
    default:
      return state;
  }
}

function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      {children}
    </TodoContext.Provider>
  );
}
```

---

### 3.2. Redux Toolkit

**Setup Store:**
```javascript
import { configureStore, createSlice } from '@reduxjs/toolkit';

// Tạo slice
const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => {
      state.value += 1; // Immer cho phép "mutate" state
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    }
  }
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// Configure store
const store = configureStore({
  reducer: {
    counter: counterSlice.reducer
  }
});

// Component
import { useSelector, useDispatch } from 'react-redux';

function Counter() {
  const count = useSelector(state => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
```

**Async Actions với createAsyncThunk:**
```javascript
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Async thunk
export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async () => {
    const response = await fetch('/api/users');
    return response.json();
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    entities: [],
    loading: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = 'idle';
        state.entities = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = 'idle';
        state.error = action.error.message;
      });
  }
});
```

---

### 3.3. React Query (TanStack Query)

**Setup:**
```javascript
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>
  );
}
```

**Basic Query:**
```javascript
function Users() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

**Mutations:**
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUser() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newUser) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate và refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  return (
    <button onClick={() => mutation.mutate({ name: 'New User' })}>
      Add User
    </button>
  );
}
```

**Pagination:**
```javascript
function Posts() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page],
    queryFn: () => fetchPosts(page),
    keepPreviousData: true
  });

  return (
    <div>
      {data?.posts.map(post => <div key={post.id}>{post.title}</div>)}
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>
        Next
      </button>
    </div>
  );
}
```

---

## 4. Advanced Patterns

### 4.1. Compound Components

Pattern cho phép components chia sẻ state ngầm định, tạo API linh hoạt hơn.

```javascript
import { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

function Tabs({ children, defaultValue }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

function TabList({ children }) {
  return <div className="tab-list">{children}</div>;
}

function Tab({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  
  return (
    <button
      className={activeTab === value ? 'active' : ''}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  
  if (activeTab !== value) return null;
  
  return <div className="tab-panel">{children}</div>;
}

// Export as compound component
Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

// Sử dụng
function App() {
  return (
    <Tabs defaultValue="tab1">
      <Tabs.List>
        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
        <Tabs.Tab value="tab3">Tab 3</Tabs.Tab>
      </Tabs.List>
      
      <Tabs.Panel value="tab1">Content 1</Tabs.Panel>
      <Tabs.Panel value="tab2">Content 2</Tabs.Panel>
      <Tabs.Panel value="tab3">Content 3</Tabs.Panel>
    </Tabs>
  );
}
```

---

### 4.2. Render Props

Pattern truyền function làm prop để chia sẻ logic.

```javascript
// Mouse Tracker với Render Props
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };

  handleMouseMove = (event) => {
    this.setState({
      x: event.clientX,
      y: event.clientY
    });
  };

  render() {
    return (
      <div onMouseMove={this.handleMouseMove}>
        {this.props.render(this.state)}
      </div>
    );
  }
}

// Sử dụng
function App() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <h1>Mouse position: ({x}, {y})</h1>
      )}
    />
  );
}

// Modern approach với hooks
function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return position;
}

// Sử dụng
function App() {
  const { x, y } = useMousePosition();
  return <h1>Mouse: ({x}, {y})</h1>;
}
```

---

### 4.3. Higher-Order Components (HOC)

HOC là function nhận component và trả về component mới.

```javascript
// HOC thêm loading state
function withLoading(Component) {
  return function WithLoadingComponent({ isLoading, ...props }) {
    if (isLoading) return <div>Loading...</div>;
    return <Component {...props} />;
  };
}

// HOC thêm authentication
function withAuth(Component) {
  return function WithAuthComponent(props) {
    const { user } = useAuth();
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    return <Component {...props} user={user} />;
  };
}

// Sử dụng
const UserListWithLoading = withLoading(UserList);
const ProtectedDashboard = withAuth(Dashboard);

// Compose multiple HOCs
const EnhancedComponent = withAuth(withLoading(Dashboard));
```

---

### 4.4. Controlled vs Uncontrolled Components

**Controlled Component:**
```javascript
function ControlledForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ name, email });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Uncontrolled Component:**
```javascript
function UncontrolledForm() {
  const nameRef = useRef();
  const emailRef = useRef();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      name: nameRef.current.value,
      email: emailRef.current.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={nameRef} defaultValue="" placeholder="Name" />
      <input ref={emailRef} defaultValue="" placeholder="Email" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### 4.5. Portal

Render children vào DOM node bên ngoài parent component.

```javascript
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}

// index.html cần có:
// <div id="root"></div>
// <div id="modal-root"></div>

// Sử dụng
function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <h2>Modal Title</h2>
        <p>Modal content here...</p>
      </Modal>
    </div>
  );
}

// Tooltip với Portal
function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const targetRef = useRef();

  const handleMouseEnter = () => {
    const rect = targetRef.current.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setShow(true);
  };

  return (
    <>
      <span
        ref={targetRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </span>
      {show && createPortal(
        <div
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, -100%)',
            background: '#333',
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px'
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  );
}
```

---

## 5. TypeScript với React

### 5.1. Component Types

**Function Component với Props:**
```typescript
import { FC, ReactNode } from 'react';

// Cách 1: FC (FunctionComponent)
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button: FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`btn-${variant}`}
    >
      {children}
    </button>
  );
};

// Cách 2: Không dùng FC (recommended)
interface CardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function Card({ title, description, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}

// Props với union types
interface UserProps {
  user: {
    id: number;
    name: string;
    email: string;
  };
  status: 'active' | 'inactive' | 'pending';
}

function UserCard({ user, status }: UserProps) {
  return <div>{user.name} - {status}</div>;
}
```

---

### 5.2. Generic Components

```typescript
// Generic List Component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// Sử dụng
interface User {
  id: number;
  name: string;
}

function UserList() {
  const users: User[] = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];

  return (
    <List
      items={users}
      renderItem={(user) => <span>{user.name}</span>}
      keyExtractor={(user) => user.id}
    />
  );
}

// Generic Select Component
interface Option {
  value: string | number;
  label: string;
}

interface SelectProps<T extends Option> {
  options: T[];
  value: T['value'];
  onChange: (value: T['value']) => void;
  placeholder?: string;
}

function Select<T extends Option>({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: SelectProps<T>) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
```

---

### 5.3. Event Handling

```typescript
import { ChangeEvent, FormEvent, MouseEvent, KeyboardEvent } from 'react';

function Form() {
  // Input change event
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  // Textarea change event
  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    console.log(e.target.value);
  };

  // Select change event
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    console.log(e.target.value);
  };

  // Form submit event
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  // Button click event
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked', e.clientX, e.clientY);
  };

  // Keyboard event
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
      />
      <textarea onChange={handleTextareaChange} />
      <select onChange={handleSelectChange}>
        <option>Option 1</option>
      </select>
      <button onClick={handleClick}>Submit</button>
    </form>
  );
}

// Generic event handler
interface FormElements extends HTMLFormElement {
  email: HTMLInputElement;
  password: HTMLInputElement;
}

function LoginForm() {
  const handleSubmit = (e: FormEvent<FormElements>) => {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    console.log({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

### 5.4. Hooks với TypeScript

```typescript
import { useState, useRef, useEffect, useCallback, useReducer } from 'react';

// useState với type inference
function Counter() {
  const [count, setCount] = useState(0); // type: number
  const [name, setName] = useState(''); // type: string
  
  // Explicit type
  const [user, setUser] = useState<User | null>(null);
  
  return <div>{count}</div>;
}

// useRef với types
function TextInputWithFocus() {
  // DOM element ref
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Mutable value ref
  const countRef = useRef<number>(0);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  
  return <input ref={inputRef} />;
}

// useCallback với types
function SearchComponent() {
  const [query, setQuery] = useState('');
  
  const handleSearch = useCallback((searchTerm: string): void => {
    console.log('Searching for:', searchTerm);
  }, []);
  
  return <input onChange={(e) => handleSearch(e.target.value)} />;
}

// useReducer với types
interface State {
  count: number;
  loading: boolean;
}

type Action =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'DECREMENT':
      return { ...state, count: state.count - 1 };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

function CounterWithReducer() {
  const [state, dispatch] = useReducer(reducer, { count: 0, loading: false });
  
  return (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
    </div>
  );
}

// Custom Hook với TypeScript
interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Sử dụng
interface User {
  id: number;
  name: string;
  email: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data, loading, error } = useFetch<User>(`/api/users/${userId}`);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;
  
  return <div>{data.name}</div>;
}
```

---

## 6. Concurrent Features (React 18+)

### 6.1. Transitions

Transitions cho phép đánh dấu updates là "non-urgent" để React có thể interrupt chúng.

```typescript
import { useState, useTransition, startTransition } from 'react';

function SearchApp() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Urgent: Update input value ngay lập tức
    setQuery(value);
    
    // Non-urgent: Update results có thể bị defer
    startTransition(() => {
      const filtered = filterLargeList(value);
      setResults(filtered);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      <ResultsList results={results} />
    </div>
  );
}

// Với startTransition (không có isPending)
function TabContainer() {
  const [tab, setTab] = useState('home');

  const selectTab = (nextTab: string) => {
    startTransition(() => {
      setTab(nextTab);
    });
  };

  return (
    <>
      <button onClick={() => selectTab('home')}>Home</button>
      <button onClick={() => selectTab('posts')}>Posts</button>
      {tab === 'home' && <Home />}
      {tab === 'posts' && <Posts />}
    </>
  );
}
```

---

### 6.2. Suspense for Data Fetching

```typescript
import { Suspense, lazy } from 'react';

// Lazy loading component
const Comments = lazy(() => import('./Comments'));

function ProfilePage() {
  return (
    <div>
      <ProfileHeader />
      <Suspense fallback={<Spinner />}>
        <Comments />
      </Suspense>
    </div>
  );
}

// Suspense với multiple boundaries
function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Header />
      <Suspense fallback={<SidebarLoader />}>
        <Sidebar />
      </Suspense>
      <Suspense fallback={<ContentLoader />}>
        <Content />
      </Suspense>
    </Suspense>
  );
}

// Suspense với data fetching (React Query)
function UserProfile({ userId }: { userId: number }) {
  const { data } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId)
  });

  return <div>{data.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userId={1} />
    </Suspense>
  );
}
```

---

### 6.3. useDeferredValue

Defer việc re-render một phần của UI.

```typescript
import { useDeferredValue, useState, memo } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
      {/* Input responsive ngay lập tức */}
      
      {/* Results update với lower priority */}
      <SearchResults query={deferredQuery} />
    </div>
  );
}

const SearchResults = memo(({ query }: { query: string }) => {
  // Expensive computation
  const results = expensiveFilter(query);
  
  return (
    <ul>
      {results.map(result => (
        <li key={result.id}>{result.name}</li>
      ))}
    </ul>
  );
});

// So sánh với useTransition
function ComparisonExample() {
  const [query, setQuery] = useState('');
  
  // Approach 1: useDeferredValue
  const deferredQuery = useDeferredValue(query);
  
  // Approach 2: useTransition
  const [isPending, startTransition] = useTransition();
  const [transitionQuery, setTransitionQuery] = useState('');

  const handleChange = (value: string) => {
    setQuery(value); // Approach 1
    
    // Approach 2
    startTransition(() => {
      setTransitionQuery(value);
    });
  };

  return <div>...</div>;
}
```

---

## 7. Testing

### 7.1. React Testing Library

**Basic Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Component
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// Tests
describe('Counter', () => {
  test('renders initial count', () => {
    render(<Counter />);
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });

  test('increments count on button click', () => {
    render(<Counter />);
    const button = screen.getByRole('button', { name: 'Increment' });
    
    fireEvent.click(button);
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
    
    fireEvent.click(button);
    expect(screen.getByText('Count: 2')).toBeInTheDocument();
  });

  test('resets count', () => {
    render(<Counter />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Increment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    
    expect(screen.getByText('Count: 0')).toBeInTheDocument();
  });
});
```

**Testing User Interactions:**
```typescript
import userEvent from '@testing-library/user-event';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill all fields');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

// Tests
describe('LoginForm', () => {
  test('shows error when fields are empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: 'Login' });
    await user.click(submitButton);
    
    expect(screen.getByRole('alert')).toHaveTextContent('Please fill all fields');
  });

  test('typing in inputs', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const usernameInput = screen.getByPlaceholderText('Username');
    const passwordInput = screen.getByPlaceholderText('Password');
    
    await user.type(usernameInput, 'john');
    await user.type(passwordInput, 'secret123');
    
    expect(usernameInput).toHaveValue('john');
    expect(passwordInput).toHaveValue('secret123');
  });
});
```

**Testing Async Operations:**
```typescript
import { waitFor, screen } from '@testing-library/react';

function UserProfile({ userId }: { userId: number }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// Tests
describe('UserProfile', () => {
  test('loads and displays user', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ id: 1, name: 'John Doe' })
      })
    ) as jest.Mock;

    render(<UserProfile userId={1} />);
    
    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/users/1');
  });
});
```

---

### 7.2. Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// Tests
describe('useCounter', () => {
  test('initializes with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  test('initializes with custom value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  test('increments count', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });

  test('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.increment();
      result.current.increment();
    });
    
    expect(result.current.count).toBe(7);
    
    act(() => {
      result.current.reset();
    });
    
    expect(result.current.count).toBe(5);
  });
});

// Testing async hook
function useFetch(url: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

describe('useFetch', () => {
  test('fetches data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ name: 'John' })
      })
    ) as jest.Mock;

    const { result } = renderHook(() => useFetch('/api/user'));
    
    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toEqual({ name: 'John' });
  });
});
```

---

### 7.3. Testing with Context

```typescript
import { render, screen } from '@testing-library/react';

const ThemeContext = createContext<'light' | 'dark'>('light');

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return <button className={theme}>Click me</button>;
}

// Custom render with providers
function renderWithTheme(ui: ReactElement, theme: 'light' | 'dark' = 'light') {
  return render(
    <ThemeContext.Provider value={theme}>
      {ui}
    </ThemeContext.Provider>
  );
}

describe('ThemedButton', () => {
  test('renders with light theme', () => {
    renderWithTheme(<ThemedButton />, 'light');
    expect(screen.getByRole('button')).toHaveClass('light');
  });

  test('renders with dark theme', () => {
    renderWithTheme(<ThemedButton />, 'dark');
    expect(screen.getByRole('button')).toHaveClass('dark');
  });
});

// Reusable test wrapper
function AllTheProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const customRender = (ui: ReactElement, options?: RenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export { customRender as render };
```

---

## 8. Advanced Architecture

### 8.1. Error Boundaries

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Sử dụng
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Header />
      <ErrorBoundary fallback={<div>Content failed to load</div>}>
        <Content />
      </ErrorBoundary>
      <Footer />
    </ErrorBoundary>
  );
}

// Functional Error Boundary với react-error-boundary
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset app state
      }}
      onError={(error, errorInfo) => {
        // Log error
      }}
    >
      <MyApp />
    </ReactErrorBoundary>
  );
}
```

---

### 8.2. Folder Structure

**Feature-based Structure:**
```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   ├── products/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   └── cart/
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   └── utils/
│       └── formatters.ts
├── lib/
│   ├── api.ts
│   └── queryClient.ts
├── App.tsx
└── main.tsx
```

**Type-based Structure:**
```
src/
├── components/
│   ├── Auth/
│   ├── Products/
│   └── shared/
├── hooks/
│   ├── useAuth.ts
│   └── useProducts.ts
├── services/
│   ├── authService.ts
│   └── productService.ts
├── store/
│   ├── authSlice.ts
│   └── productSlice.ts
├── types/
│   ├── auth.ts
│   └── product.ts
├── utils/
│   └── helpers.ts
└── App.tsx
```

---

### 8.3. Design System Example

```typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#f0f9ff',
    500: '#0ea5e9',
    900: '#0c4a6e'
  },
  neutral: {
    50: '#f9fafb',
    500: '#6b7280',
    900: '#111827'
  }
} as const;

// tokens/spacing.ts
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem'
} as const;

// components/Button/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children,
  onClick,
  disabled 
}: ButtonProps) {
  const baseStyles = 'rounded font-medium transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// components/Input/Input.tsx
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Input({ 
  label, 
  error, 
  helperText, 
  size = 'md',
  ...props 
}: InputProps) {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`
          ${sizeStyles[size]}
          w-full border rounded-md
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

// Theme Provider
interface Theme {
  colors: typeof colors;
  spacing: typeof spacing;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = { colors, spacing };
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

---

## 9. Server-Side Rendering (SSR)

### 9.1. Next.js Patterns

**App Router (Next.js 13+):**
```typescript
// app/page.tsx - Server Component mặc định
async function HomePage() {
  // Fetch data trực tiếp trong component
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  
  return (
    <main>
      <h1>Blog Posts</h1>
      <PostsList posts={posts} />
    </main>
  );
}

export default HomePage;

// app/posts/[id]/page.tsx - Dynamic Route
interface PageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

async function PostPage({ params }: PageProps) {
  const post = await fetch(`https://api.example.com/posts/${params.id}`)
    .then(r => r.json());
  
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}

// Generate static params
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  
  return posts.map((post: any) => ({
    id: post.id.toString(),
  }));
}

export default PostPage;

// app/dashboard/page.tsx - Client Component
'use client';

import { useState, useEffect } from 'react';

function DashboardPage() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData);
  }, []);
  
  return <div>Dashboard: {data?.value}</div>;
}

export default DashboardPage;
```

**Data Fetching Patterns:**
```typescript
// Server Component với cache
async function ProductList() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 } // Revalidate mỗi giờ
  }).then(r => r.json());
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Loading UI
// app/products/loading.tsx
export default function Loading() {
  return <div>Loading products...</div>;
}

// Error UI
// app/products/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// Layout
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

// Metadata
export const metadata = {
  title: 'My App',
  description: 'Generated by Next.js',
};
```

**API Routes:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  
  const users = await db.users.findMany({
    where: { name: { contains: query } }
  });
  
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const user = await db.users.create({
    data: body
  });
  
  return NextResponse.json(user, { status: 201 });
}

// app/api/users/[id]/route.ts
interface RouteContext {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const user = await db.users.findUnique({
    where: { id: params.id }
  });
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user);
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  await db.users.delete({
    where: { id: params.id }
  });
  
  return NextResponse.json({ success: true });
}
```

**Server Actions:**
```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  await db.posts.create({
    data: { title, content }
  });
  
  revalidatePath('/posts');
}

// app/posts/new/page.tsx
import { createPost } from '@/app/actions';

function NewPostPage() {
  return (
    <form action={createPost}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <button type="submit">Create Post</button>
    </form>
  );
}

// Với useFormState và useFormStatus
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createPost } from '@/app/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  );
}

function NewPostForm() {
  const [state, formAction] = useFormState(createPost, null);
  
  return (
    <form action={formAction}>
      <input name="title" />
      <textarea name="content" />
      <SubmitButton />
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}
```

---

### 9.2. Streaming và Suspense

```typescript
// Streaming với Suspense boundaries
import { Suspense } from 'react';

async function SlowComponent() {
  await new Promise(resolve => setTimeout(resolve, 3000));
  const data = await fetch('https://api.example.com/slow').then(r => r.json());
  return <div>{data.content}</div>;
}

function Page() {
  return (
    <div>
      <h1>Fast Content</h1>
      <Suspense fallback={<div>Loading slow content...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  );
}

// Multiple Suspense boundaries
function Dashboard() {
  return (
    <div>
      <Suspense fallback={<Skeleton />}>
        <UserStats />
      </Suspense>
      
      <Suspense fallback={<Skeleton />}>
        <RecentActivity />
      </Suspense>
      
      <Suspense fallback={<Skeleton />}>
        <Charts />
      </Suspense>
    </div>
  );
}

// Preloading
import { preload } from 'react-dom';

function BlogPost({ postId }: { postId: string }) {
  // Preload related posts
  preload(`/api/posts/${postId}/related`, {
    as: 'fetch',
    crossOrigin: 'anonymous'
  });
  
  return <PostContent postId={postId} />;
}
```

---

## 10. Animation

### 10.1. Framer Motion

```typescript
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

// Basic Animation
function FadeIn() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Fade in content
    </motion.div>
  );
}

// Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

function List({ items }: { items: string[] }) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, i) => (
        <motion.li key={i} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// AnimatePresence cho mount/unmount
function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={e => e.stopPropagation()}
          >
            Modal Content
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Gestures
function DraggableCard() {
  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      dragElastic={0.2}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Drag me!
    </motion.div>
  );
}

// Scroll Animations
import { useScroll, useTransform } from 'framer-motion';

function ParallaxSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  
  return (
    <motion.div style={{ y }}>
      Parallax content
    </motion.div>
  );
}

// useAnimation hook
function ControlledAnimation() {
  const controls = useAnimation();
  
  const startAnimation = async () => {
    await controls.start({ x: 100 });
    await controls.start({ y: 100 });
    await controls.start({ rotate: 180 });
  };
  
  return (
    <>
      <motion.div animate={controls} />
      <button onClick={startAnimation}>Animate</button>
    </>
  );
}

// Layout Animations
function ExpandableCard({ isExpanded }: { isExpanded: boolean }) {
  return (
    <motion.div layout>
      <motion.h2 layout>Card Title</motion.h2>
      {isExpanded && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Card content...
        </motion.p>
      )}
    </motion.div>
  );
}
```

---

### 10.2. CSS-in-JS với Styled Components

```typescript
import styled, { css, keyframes, ThemeProvider } from 'styled-components';

// Basic styling
const Button = styled.button<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#007bff' : '#6c757d'};
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Extending styles
const PrimaryButton = styled(Button)`
  background: #007bff;
`;

const LargeButton = styled(Button)`
  padding: 15px 30px;
  font-size: 18px;
`;

// Props interpolation
const Input = styled.input<{ $hasError?: boolean }>`
  padding: 8px 12px;
  border: 2px solid ${props => props.$hasError ? '#dc3545' : '#ced4da'};
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.$hasError ? '#dc3545' : '#007bff'};
  }
`;

// Keyframes
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

// Theming
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545'
  },
  spacing: {
    small: '8px',
    medium: '16px',
    large: '24px'
  }
};

const ThemedButton = styled.button`
  background: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.medium};
  color: white;
  border: none;
  border-radius: 4px;
`;

function App() {
  return (
    <ThemeProvider theme={theme}>
      <ThemedButton>Themed Button</ThemedButton>
    </ThemeProvider>
  );
}

// CSS Helper
const flexCenter = css`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Card = styled.div`
  ${flexCenter}
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

// Global Styles
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto';
    -webkit-font-smoothing: antialiased;
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <YourApp />
    </>
  );
}

// Attrs
const Input = styled.input.attrs<{ $size?: 'small' | 'large' }>(props => ({
  type: 'text',
  size: props.$size === 'small' ? 5 : props.$size === 'large' ? 20 : 10
}))`
  border-radius: 4px;
  border: 2px solid #ddd;
  padding: ${props => props.$size === 'large' ? '12px' : '8px'};
`;
```

---

## 11. Best Practices & Patterns

### 11.1. Code Organization

```typescript
// Feature slice structure
// features/todos/todosSlice.ts
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodosState {
  items: Todo[];
  filter: 'all' | 'active' | 'completed';
}

// features/todos/TodoList.tsx
export function TodoList() {
  const todos = useTodos();
  return (
    <ul>
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// features/todos/index.ts - Public API
export { TodoList } from './TodoList';
export { useTodos } from './hooks/useTodos';
export type { Todo } from './todosSlice';
```

---

### 11.2. Performance Best Practices

```typescript
// ❌ Bad: Creating functions in render
function ParentBad() {
  return <Child onClick={() => console.log('clicked')} />;
}

// ✅ Good: Memoize callbacks
function ParentGood() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  
  return <Child onClick={handleClick} />;
}

// ❌ Bad: Inline object creation
function ParentBad() {
  return <Child style={{ margin: 10 }} />;
}

// ✅ Good: Stable reference
const styles = { margin: 10 };

function ParentGood() {
  return <Child style={styles} />;
}

// ❌ Bad: Unnecessary computation on every render
function ExpensiveComponent({ items }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return <div>{total}</div>;
}

// ✅ Good: Memoize expensive computations
function ExpensiveComponent({ items }) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items]
  );
  return <div>{total}</div>;
}

// ❌ Bad: Large component
function UserDashboard() {
  // 500 lines of code...
}

// ✅ Good: Split into smaller components
function UserDashboard() {
  return (
    <>
      <UserProfile />
      <UserStats />
      <UserActivity />
      <UserSettings />
    </>
  );
}
```

---

### 11.3. Security Best Practices

```typescript
// XSS Prevention

// ❌ Bad: Dangerous HTML rendering
function BadComponent({ htmlContent }) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

// ✅ Good: Sanitize HTML
import DOMPurify from 'dompurify';

function SafeComponent({ htmlContent }) {
  const sanitized = DOMPurify.sanitize(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}

// ✅ Better: Use React's escaping
function BetterComponent({ text }) {
  return <div>{text}</div>; // React escapes automatically
}

// Secure API calls
// ❌ Bad: Exposing sensitive data
const API_KEY = 'secret-key-123'; // Never in client code!

// ✅ Good: Use environment variables (server-side)
// .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
API_SECRET_KEY=secret-key-123

// Client can only access NEXT_PUBLIC_* variables
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Server-side API calls with secrets
// app/api/data/route.ts
export async function GET() {
  const response = await fetch('https://api.example.com/data', {
    headers: {
      'Authorization': `Bearer ${process.env.API_SECRET_KEY}`
    }
  });
  
  return Response.json(await response.json());
}

// CSRF Protection
function SecureForm() {
  const [csrfToken, setCsrfToken] = useState('');
  
  useEffect(() => {
    fetch('/api/csrf-token')
      .then(r => r.json())
      .then(data => setCsrfToken(data.token));
  }, []);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(formData)
    });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

### 11.4. Accessibility (a11y)

```typescript
// Semantic HTML
function GoodButton() {
  return <button onClick={handleClick}>Click me</button>;
}

// ❌ Bad
function BadButton() {
  return <div onClick={handleClick}>Click me</div>;
}

// ARIA attributes
function Dropdown({ isOpen, children }) {
  return (
    <div>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="dropdown-menu"
      >
        Menu
      </button>
      {isOpen && (
        <ul id="dropdown-menu" role="menu">
          {children}
        </ul>
      )}
    </div>
  );
}

// Focus management
function Modal({ isOpen, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div role="dialog" aria-modal="true">
      <h2 id="modal-title">Modal Title</h2>
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

// Keyboard navigation
function Menu() {
  const [activeIndex, setActiveIndex] = useState(0);
  const items = ['Home', 'About', 'Contact'];
  
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + items.length) % items.length);
        break;
      case 'Enter':
        console.log('Selected:', items[activeIndex]);
        break;
    }
  };
  
  return (
    <ul role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <li
          key={item}
          role="menuitem"
          tabIndex={index === activeIndex ? 0 : -1}
          aria-selected={index === activeIndex}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

// Screen reader friendly
function LoadingSpinner() {
  return (
    <div role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true"></span>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Form labels
function AccessibleForm() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        aria-required="true"
        aria-describedby="email-help"
      />
      <span id="email-help">We'll never share your email</span>
      
      <fieldset>
        <legend>Choose your plan</legend>
        <label>
          <input type="radio" name="plan" value="free" />
          Free
        </label>
        <label>
          <input type="radio" name="plan" value="pro" />
          Pro
        </label>
      </fieldset>
    </form>
  );
}
```

---

## 12. Debugging & DevTools

### 12.1. React DevTools

```typescript
// Component naming for DevTools
// ❌ Bad: Anonymous components
export default () => <div>Content</div>;

// ✅ Good: Named components
export default function MyComponent() {
  return <div>Content</div>;
}

// Profiler API
import { Profiler } from 'react';

function onRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} (${phase}) took ${actualDuration}ms`);
}

function App() {
  return (
    <Profiler id="App" onRender={onRender}>
      <Navigation />
      <Main />
    </Profiler>
  );
}
```

---

### 12.2. Error Logging

```typescript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn-here',
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});

const SentryRoutes = Sentry.withSentryRouting(Routes);

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <BrowserRouter>
        <SentryRoutes>
          <Route path="/" element={<Home />} />
        </SentryRoutes>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

// Custom error logging
function logError(error: Error, errorInfo: ErrorInfo) {
  // Log to service
  fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify({
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })
  });
}
```

---

## 13. Kết Luận

Tài liệu này bao gồm các khía cạnh nâng cao nhất của React:

✅ **Hooks nâng cao**: useReducer, useCallback, useMemo, custom hooks
✅ **Performance**: Memoization, code splitting, virtualization
✅ **State Management**: Context, Redux, React Query
✅ **Patterns**: Compound components, HOC, render props
✅ **TypeScript**: Type-safe React development
✅ **Concurrent Features**: Transitions, Suspense
✅ **Testing**: Component và integration testing
✅ **SSR**: Next.js patterns và best practices
✅ **Animation**: Framer Motion, CSS-in-JS
✅ **Best Practices**: Security, accessibility, code organization

### Resources Thêm:
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query)
- [Testing Library](https://testing-library.com/react)

---

**Lưu ý**: Tài liệu này được cập nhật theo React 18+ và Next.js 14. Các pattern và best practices có thể thay đổi theo phiên bản mới