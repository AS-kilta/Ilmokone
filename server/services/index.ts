import { Service } from '@feathersjs/feathers';
import { AuthenticationService } from '@feathersjs/authentication';
import adminevents from './admin/events';
import adminsignups from './admin/signups';
import event, { EventsService } from './event';
import signup, { SignupsService } from './signup';
import user, { UsersService } from './user';
import authentication from './authentication';
import { IlmoApplication } from '../defs';
import { Event } from '../models/event';
import { Signup } from '../models/signup';

// TODO: update these to match the actual result types
export type AdminEventsService = Service<Event>;
export type AdminSignupsService = Service<Signup>;

export interface IlmoServices {
  '/api/admin/events': AdminEventsService;
  '/api/admin/signups': AdminSignupsService;
  '/api/authentication': AuthenticationService;
  '/api/events': EventsService;
  '/api/signups': SignupsService;
  '/api/users': UsersService;
}

export default function (this: IlmoApplication) {
  const app = this;

  app.configure(authentication);
  app.configure(adminevents);
  app.configure(adminsignups);
  app.configure(event);
  app.configure(signup);
  app.configure(user);
}
