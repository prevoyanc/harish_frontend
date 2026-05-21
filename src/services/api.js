import axios from 'axios';

const API = axios.create({ baseURL: 'http://35.207.195.114:9000/backend/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');

// Dashboard
export const getAdminDashboard = () => API.get('/dashboard/admin');

// Users
export const getUsers = (params) => API.get('/users', { params });
export const getUserById = (id) => API.get(`/users/${id}`);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);
export const activateUser = (id) => API.put(`/users/${id}`, { status: 'active' });

// Categories
export const getCategories = () => API.get('/categories');
export const createCategory = (data) => API.post('/categories', data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Products
export const getProducts = (params) => API.get('/products', { params });
export const getProductById = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Dealers
export const getDealers = (params) => API.get('/dealers', { params });
export const getDealerById = (id) => API.get(`/dealers/${id}`);
export const updateDealer = (id, data) => API.put(`/dealers/${id}`, data);
export const getDealerPointsHistory = (id) => API.get(`/dealers/${id}/points-history`);
export const deleteDealer = (id) => API.delete(`/dealers/${id}`);

// Orders
export const getOrders = (params) => API.get('/orders', { params });
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const createOrder = (data) => API.post('/orders', data);
export const updateOrder = (id, data) => API.put(`/orders/${id}`, data);

// Points Config
export const getPaymentSlabs = () => API.get('/points-config/payment-slabs');
export const createPaymentSlab = (data) => API.post('/points-config/payment-slabs', data);
export const updatePaymentSlab = (id, data) => API.put(`/points-config/payment-slabs/${id}`, data);
export const deletePaymentSlab = (id) => API.delete(`/points-config/payment-slabs/${id}`);
export const getProductRules = () => API.get('/points-config/product-rules');
export const createProductRule = (data) => API.post('/points-config/product-rules', data);
export const updateProductRule = (id, data) => API.put(`/points-config/product-rules/${id}`, data);
export const deleteProductRule = (id) => API.delete(`/points-config/product-rules/${id}`);

// Redemption
export const getRewardCatalog = (params) => API.get('/redemption/catalog', { params });
export const createReward = (data) => API.post('/redemption/catalog', data);
export const updateReward = (id, data) => API.put(`/redemption/catalog/${id}`, data);
export const deleteReward = (id) => API.delete(`/redemption/catalog/${id}`);
export const getRedemptions = () => API.get('/redemption/requests');
export const updateRedemptionStatus = (id, data) => API.put(`/redemption/requests/${id}`, data);

// Register (admin creating users)
export const registerUser = (data) => API.post('/auth/register', data);

// Employee Product Allocation
export const allocateProducts = (data) => API.post('/employee-products/allocate', data);
export const getAllAllocations = () => API.get('/employee-products/all');
export const getEmployeeProducts = (employeeId) => API.get(`/employee-products/employee/${employeeId}`);

// Sale Submissions
export const getSaleSubmissions = (params) => API.get('/sale-submissions/all', { params });

// Assignments with product status (for sales tracking)
export const getAssignmentProducts = (params) => API.get('/assignments/all', { params });

// Attendance Live
export const getLivePunchCount = () => API.get('/attendance/live');
export const getAllAttendance = () => API.get('/attendance/all');

// Assignments
export const createAssignment = (data) => API.post('/assignments', data);
export const getAssignments = (params) => API.get('/assignments/all', { params });
export const deleteAssignment = (id) => API.delete(`/assignments/${id}`);

// Emp-wise Dealers
export const getEmployeeDropdown = () => API.get('/emp-wise-dealers/employee-dropdown');
export const getDealerDropdown = () => API.get('/emp-wise-dealers/dealer-dropdown');
export const getEmployeeSelfDealers = (id) => API.get(`/emp-wise-dealers/employee-self-dealers/${id}`);
export const getEmpWiseDealers = (params) => API.get('/emp-wise-dealers', { params });
export const createEmpWiseDealers = (data) => API.post('/emp-wise-dealers/create', data);
export const updateEmpWiseDealers = (id, data) => API.put(`/emp-wise-dealers/${id}`, data);
export const deleteEmpWiseDealers = (id) => API.delete(`/emp-wise-dealers/${id}`);

// Attendance Management
export const getDailyReport = (params) => API.get('/attendance/daily-report', { params });
export const adminPunch = (data) => API.post('/attendance/admin-punch', data);
export const markAbsent = (data) => API.post('/attendance/mark-absent', data);
export const getKmReport = (params) => API.get('/attendance/km-report', { params });

export default API;
