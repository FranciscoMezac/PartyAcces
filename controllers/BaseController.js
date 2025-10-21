
class BaseController {
    /**
     * @param {Object} res 
     * @param {Object} data 
     * @param {number} statusCode 
     */
    sendSuccess(res, data = {}, statusCode = 200) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            ...data
        }));
    }

    /**
     * @param {Object} res 
     * @param {string} message 
     * @param {number} statusCode 
     */
    sendError(res, message, statusCode = 400) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            message: message
        }));
    }

    /**
     * @param {Object} data 
     * @param {Array} requiredFields 
     * @returns {Object|null} 
     */
    validateRequiredFields(data, requiredFields) {
        const missingFields = requiredFields.filter(field => !data[field]);
        
        if (missingFields.length > 0) {
            return {
                isValid: false,
                message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
            };
        }
        
        return { isValid: true };
    }

    /**

     * @param {Object} res 
     * @param {Error} error 
     * @param {string} context 
     */
    handleError(res, error, context = 'operación') {
        console.error(`Error en ${context}:`, error);
        
        if (error.code === '23505') {
            this.sendError(res, 'El email ya está en uso', 400);
            return;
        }
        
        this.sendError(res, `Error interno del servidor en ${context}`, 500);
    }
}

module.exports = BaseController;
