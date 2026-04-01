import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
});

export const getSubscribers = () => api.get("/subscribers");
export const addSubscriber = (data) => api.post("/subscribe", data);
export const updateSubscriber = (id, data) => api.patch(`/subscriber/${id}`, data);
export const deleteSubscriber = (id) => api.delete(`/subscriber/${id}`);
export const sendNow = () => api.post("/send-now");
export const getLogs = () => api.get("/logs");