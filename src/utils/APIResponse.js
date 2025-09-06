class APIResponse {
    constructor(statuCode, data, messgae ="Success") {
        this.statuCode = statuCode,
        this.data = data,
        this.message = messgae,
        this.success = statuCode < 400
    }
}

export { APIResponse }