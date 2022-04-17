import axios from 'axios';
import {config} from "./config";
// default
axios.defaults.baseURL = config.API_URL;
// content type
// axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.post['Accept'] = 'application/json';
// intercepting to capture errors
axios.interceptors.response.use(
    (response)=> {
        return response.data ? response.data : response;
    }, 
    (error)=> {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let message;
    switch (error.response?.status) {
        case 500: message = 'Internal Server Error'; break;
        // case 400: message = 'Invalid credentials'; break;
        // case 401: message = 'Invalid credentials'; break;
        // case 404: message = "Sorry! the data you are looking for could not be found"; break;
        default: message = error.message || error;
    }
    const data=error.response?.data
    if(data?.non_field_errors){
        message=data.non_field_errors.join("; ");
    }
    return Promise.reject({
        message, 
        data
    });
});
/**
 * Sets the default authorization
 * @param {*} token 
 */
export const setAuthorization = (token) => {
    // set or unset authoeization header
    if(token){
        axios.defaults.headers.common['Authorization'] = 'Token ' + token;
    }else{
        delete axios.defaults.headers.common['Authorization'] //= undefined;
    } 
}


export class APIClient {
    /**
     * Fetches data from given url
     */
    get = (url, params) => {
        return axios.get(url, params);
    }

    /**
     * post given data to url
     */
    create = (url, data) => {
        // console.log("data request", url, data);
        return axios.post(url, data);
    }
    post = (url, data, options={}) => {
        // console.log("data posted", data, typeof data)
        return axios.post(url, data, options);
    }
    /**
     * Updates data
     */
    update = (url, data, options={}) => {
        return axios.patch(url, data, options);
    }
    patch = (url, data, options={}) => {
        return axios.patch(url, data, options);
    }
    /**
     * Delete 
     */
    delete = (url) => {
        return axios.delete(url);
    }
}
export const requests=new APIClient()
// export { APIClient, setAuthorization,requests};

