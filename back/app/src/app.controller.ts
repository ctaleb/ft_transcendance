import { Controller, Request, Response, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { use } from 'passport';

@Controller()
export class AppController {
}