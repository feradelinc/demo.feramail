
async function transform(xsl, xml) {
    const url = global.settings.rendering.server + "/api/v1/xml";
    try {
        const response = await global.settings.post(url, { xml, xsl });

        if (response.status !== 200) throw {
            status: response.status, message: response.error?.message ?? "Unknown error"
        };

        return response.data.result;
    } catch (error) {
        const data = error?.response?.data;
        throw {
            status: error?.response?.status || error?.status || 500,
            message:
                data?.message ||
                data?.error?.message ||
                error?.message ||
                "Rendering failed",
            meta: data || error?.meta || null
        };
    }
}


module.exports = {
    transform
};
