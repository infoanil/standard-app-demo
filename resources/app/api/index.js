axios.defaults.baseURL = process.env.MIX_APP_URL;

class AxiosClass {

    async get(url, config = {}) {
        return this.responseHandler(axios.get(url, config));
    }

    post(url, body, headers = {}) {
        return this.responseHandler(
            axios.post(url, body , {
                headers: headers
            })
        );
    }

    put(url, body, headers = {}) {
        return this.responseHandler(axios.put(url, body, {
            headers: headers
        }));
    }

    delete(url, headers = {}) {
        return this.responseHandler(axios.delete(url,{
            headers: headers
        }));
    }

    async responseHandler(responsePromise) {
        try {
            return await responsePromise;
        } catch (error) {
            throw error;
        }
    }
}
export const API = new AxiosClass();
