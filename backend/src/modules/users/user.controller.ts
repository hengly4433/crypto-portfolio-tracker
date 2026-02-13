import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const user = await this.userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Convert BigInt to string for JSON serialization
      const response = JSON.parse(JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Implementation for updating user profile
      // This would require a more comprehensive user service with update functionality
      res.status(501).json({ message: 'Not implemented yet' });
    } catch (error) {
      next(error);
    }
  };
}