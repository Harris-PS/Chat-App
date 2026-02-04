const healthCheck =(req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
};

module.exports = {
    healthCheck
};