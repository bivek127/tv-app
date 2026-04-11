const usersService = require('../services/users.service');
const bcrypt = require('bcryptjs');

async function getProfile(req, res, next) {
    try {
        const user = await usersService.findUserById(req.user.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { name } = req.body;
        const user = await usersService.updateProfile(req.user.id, { name });
        res.json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
}

async function updatePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;

        const existing = await usersService.findUserByEmail(req.user.email);
        if (!existing || existing.provider !== 'local') {
            return res.status(400).json({ success: false, error: 'Password change is only available for email accounts' });
        }

        const valid = await bcrypt.compare(currentPassword, existing.password_hash);
        if (!valid) return res.status(400).json({ success: false, error: 'Current password is incorrect' });

        const hash = await bcrypt.hash(newPassword, 12);
        await usersService.updatePassword(req.user.id, hash);

        res.json({ success: true, data: { message: 'Password updated' } });
    } catch (err) {
        next(err);
    }
}

module.exports = { getProfile, updateProfile, updatePassword };
