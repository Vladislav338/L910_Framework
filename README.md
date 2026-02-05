# веб-фреймворк для афиши кинотеатра по варианту 22

## Сущности

### Фильм
```json
{
  "id": number,
  "title": string,
  "genre": Array<string>,
  "duration": number,
  "isPremiere": boolean,
  "releaseDate": string (Date),
  "rating": number
}

### Сеанс
```json
{
  "id": number,
  "movieId": number,
  "hall": number,
  "dateTime": string (Date),
  "ticketsAvailable": number,
  "is3D": boolean,
  "price": number,
  "occupiedSeats": Array<number>
}
