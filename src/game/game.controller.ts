// import {
//   Controller,
//   Get,
//   Post,
//   Body,
//   Patch,
//   Param,
//   Delete,
// } from '@nestjs/common';
// import { CreateGameDto } from './dto/create-game.dto';
// import { UpdateGameDto } from './dto/update-game.dto';
// import { GamesService } from './game.service';

// @Controller('game')
// export class GameController {
//   constructor(private readonly gameService: GamesService) {}

//   @Post()
//   create(@Body() createGameDto: CreateGameDto) {
//     return this.gameService.create(createGameDto);
//   }

//   @Get()
//   findAll() {
//     return this.gameService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gameService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
//     return this.gameService.update(+id, updateGameDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gameService.remove(+id);
//   }
// }
