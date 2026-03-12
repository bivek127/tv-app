const usersService = require('../services/users.service');

async function getAllUsers(req, res, next) {
    try {
        const users = await usersService.getAllUsers();
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await usersService.deleteUserById(id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, data: { message: `User ${user.email} deleted` } });
    } catch (err) {
        next(err);
    }
}

module.exports = { getAllUsers, deleteUser };
