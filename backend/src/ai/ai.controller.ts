import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { AskDto } from './dto/ask.dto';

@ApiBearerAuth()
@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('ask')
  ask(@Body() dto: AskDto) {
    return this.ai.ask(dto.question);
  }
}
