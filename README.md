# rozhlas-export

1. for each category, last 24 hours
    1.1. get audio
    1.2. open audio
    1.3. get audio name
    1.4. if audio name does not exist in db
        1.4.1. create a new audio record in db
        1.4.2. take all episodes from audio and send episode notification 
    1.5. else if audio name exists in db
        1.5.1. use the existing audio 
        1.5.2. take last episode from audio and send episode notification

2. SNS subscription youtube music
    2.1. read message - url, category, audio name, episode part
    2.2. 
