const jwt = require("jsonwebtoken");

exports.verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ msg: "Where da token at??" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ msg: "GET OUT!!! Invalid Auth format" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (err) {
        console.error(err);
        return res.status(401).json({ msg: "Invalid token or expired" });
    }
};

exports.verifySocketJWT = (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Where da socket token at??"));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = { id: decoded.id };
        next();
    } catch (err) {
        console.error(err);
        return next(new Error("Invalid socket token or expired"));
    }
};
