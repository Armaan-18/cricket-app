import { IsNotEmpty, IsString, IsDateString, IsNumber, IsEnum, IsIn } from 'class-validator';

export enum EventType {
  SinRun = 'Single Run',
  DblRun = 'Double Run',
  TrpRun = 'Tripple Run',
  Four = 'Four',
  Six = 'Six',
  Wicket = 'wicket',
  Catch = 'catch out',
  Wide = 'wide',
  NoBall = 'no-ball',
  Dot = 'dot',
}

export class CreateMatchDto {

  @IsString()
  @IsNotEmpty()
  teamA: string;

  @IsString()
  @IsNotEmpty()
  teamB: string;

  @IsDateString()
  @IsNotEmpty()
  date: Date;
}

export class AddCommentaryDto {

  @IsNumber()
  @IsNotEmpty()
  over: number;

  @IsNumber()
  @IsNotEmpty()
  ball: number;

 @IsString()
 @IsNotEmpty()
 @IsIn(['Single Run', 'Double Run', 'Tripple Run', 'Four', 'Six', 'Wicket', 'Catch', 'Wide', 'NoBall', 'Dot'])
 event: string;
}
