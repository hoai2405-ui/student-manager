import axios from "axios";

const api = import.meta.env.VITE_API_URL || "";

const instance = axios.create({
  baseURL: api,
  withCredentials: false,
});

export default instance;
