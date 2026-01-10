import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '../models/User';
import { config } from './env';

type JwtPayload = { userId: string };

passport.use(
  new LocalStrategy(
    {
      usernameField: 'username',
      passwordField: 'password',
    },
    async (username, password, done) => {
      try {
        const normalizedUsername = username.trim().toLowerCase();

        const user = await User.findOne({ username: normalizedUsername }).select('+passwordHash');

        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        const authUser = {
          id: user.id,
          username: user.username,
          name: user.name,
        };

        return done(null, authUser);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.JWT_SECRET,
    },
    async (payload: JwtPayload, done) => {
      try {
        const user = await User.findById(payload.userId).select('_id username name');

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        const authUser = {
          id: user.id,
          username: user.username,
          name: user.name,
        };

        return done(null, authUser);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
