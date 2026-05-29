import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DbService } from '../db/db.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private db: DbService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'film-lab-secret-key-2024',
    });
  }

  async validate(payload: any) {
    const user = this.db.findById('users', payload.sub);
    if (!user) {
      return null;
    }
    const { password, ...result } = user;
    return result;
  }
}
