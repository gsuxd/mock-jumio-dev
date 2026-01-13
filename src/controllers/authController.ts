import { Request, Response } from 'express';
import { generateOAuth2Token } from '../utils/jwt';

export class AuthController {
  // POST /oauth2/token
  static async getToken(req: Request, res: Response): Promise<void> {
    try {
      const { grant_type } = req.body;

      if (grant_type !== 'client_credentials') {
        res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials grant type is supported'
        });
        return;
      }

      const accessToken = generateOAuth2Token();

      res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600
      });
    } catch (error) {
      res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to generate token',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
