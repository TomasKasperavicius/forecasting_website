import { HttpMethod } from '../types/types';
import { FetchResponse, FetchResult } from '../types/interfaces';

export const useFetch = <T>(): FetchResult<T> => {
  const fetchData = async (url: string, method: HttpMethod = 'GET', payload: any = null, file: File | null= null): Promise<FetchResponse<T>> => {
    try {
      const formData = new FormData();
      let body: any = null;
      let options: RequestInit = {}
      // Set body and headers
      if (file instanceof File) {
        formData.append('file', file);
        formData.append('user_id', payload.user_id);
        options = {
          method,
          body: formData,
        };
      } else if (payload) {
        body = JSON.stringify(payload);
        options = {
          headers: {
            "Content-type": "application/json"
          },
          method,
          body: body,
        };
      }
      // Make the request
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error('Request failed');
      }
      // Parse json response to javascript object
      const jsonData: T = await response.json();
      return { data: jsonData, statusCode: response.status };
    } catch (error) {
      throw error;
    }
    
  }
  return { fetchData }
};
