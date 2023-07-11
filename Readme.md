**LABAYH RESTAURANT API SERVICE**

Author: Fahad Tahir


To run:

1. npm install
2. move .env file to root directory
3. node index.js

Postman Collection: 
https://www.postman.com/doctechnical-architect-14479179/workspace/fahad/collection/19813531-489d1da4-baaf-4e7a-a05b-e03c0eed2b32?action=share&creator=19813531


Notes:
I was unsure whether to include 'City' as a DBRef in Restaurant or not, since it's not recommended to do so in Mongo.
However I did it because otherwise the seperate collection for City and initializing 2 cities didn't make sense.