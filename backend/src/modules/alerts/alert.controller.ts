import { Request, Response, NextFunction } from 'express';
import { AlertService } from './alert.service';
import { NotFoundError } from '../../common/errors/http-error';
import { CreateAlertDto, UpdateAlertDto } from './alert.dto';

export class AlertController {
  private alertService: AlertService;

  constructor() {
    this.alertService = new AlertService();
  }

  /**
   * Create a new alert
   */
  createAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const createAlertDto: CreateAlertDto = {
        portfolioId: req.body.portfolioId ? BigInt(req.body.portfolioId) : undefined,
        assetId: req.body.assetId ? BigInt(req.body.assetId) : undefined,
        alertType: req.body.alertType,
        conditionValue: req.body.conditionValue,
        lookbackWindowMinutes: req.body.lookbackWindowMinutes,
      };

      const alert = await this.alertService.createAlert(userId, createAlertDto);
      
      const response = JSON.parse(JSON.stringify(alert, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all alerts for current user
   */
  getAlerts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const alerts = await this.alertService.getUserAlerts(userId);
      
      const response = JSON.parse(JSON.stringify(alerts, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific alert
   */
  getAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const alertId = BigInt(String(req.params.id));
      
      const alert = await this.alertService.getAlertById(userId, alertId);
      
      const response = JSON.parse(JSON.stringify(alert, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update an alert
   */
  updateAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const alertId = BigInt(String(req.params.id));
      const updateAlertDto: UpdateAlertDto = {
        isActive: req.body.isActive,
        conditionValue: req.body.conditionValue,
        lookbackWindowMinutes: req.body.lookbackWindowMinutes,
      };

      const alert = await this.alertService.updateAlert(userId, alertId, updateAlertDto);
      
      const response = JSON.parse(JSON.stringify(alert, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an alert
   */
  deleteAlert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const alertId = BigInt(String(req.params.id));
      
      await this.alertService.deleteAlert(userId, alertId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get notifications for current user
   */
  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = BigInt(req.user!.userId);
      const notifications = await this.alertService.getUserNotifications(userId);
      
      const response = JSON.parse(JSON.stringify(notifications, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      ));
      
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark notification as read
   */
  markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = BigInt(String(req.params.notificationId));
      
      await this.alertService.markNotificationAsSent(notificationId);
      
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  };
}