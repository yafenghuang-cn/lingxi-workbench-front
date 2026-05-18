import axios from "axios";

const instance = axios.create({
  timeout: 5000,
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (response) => {
    return response.data.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default instance;
