import api from '../api/axiosConfig';
export const authenticatorStatus = async () => (await api.get('/users/authenticator', {timeout:20000})).data;
export const authenticatorAction = async (action, proof) => (await api.post(`/users/authenticator/${action}`, proof, {timeout:20000})).data;
