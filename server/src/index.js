require('dotenv').config()

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const { GOOGLE_KEY } = process.env


const app = express();

app.use(cors())
app.use(express.json());


let cache,
    url = `https://www.googleapis.com/youtube/v3/playlistItems?maxResults=50&part=snippet&playlistId=PLeLKux5eT3kaXJ4p_P96I9lr7qEpnbWTY&key=${GOOGLE_KEY}`

const getVideos = pageToken =>
    axios.get(url + (pageToken ? `&pageToken=${pageToken}` : '')).then( res => res.data)

const organizeVideos = items => items.map( ({snippet}) => {
    return {
        publishedAt: snippet.publishedAt,
        title: snippet.title,
        description: snippet.description,
        thumbnails: snippet.thumbnails,
        videoId: snippet.resourceId.videoId
    }
})

app.get('/videos', async (req, res) => {
    if (cache) return res.json(cache)

    try {
        let data = await getVideos(),
            videos = organizeVideos(data.items)

        while(data.nextPageToken) {
            data = await getVideos(data.nextPageToken)
            videos = videos.concat(organizeVideos(data.items))
        }

        cache = videos
        return res.json(videos)
    } catch (error) {
        throw new Error(error)
    }
})

const notFound = (req, res, next) => {
    res.status(404)
    const error = new Error('NOT_FOUND')
    next(error)
}

const errorHandler = (error, req, res, next) => {
    res.status(res.statusCode || 500)
    res.json({ message: error.message })
}

app.use(notFound)
app.use(errorHandler)

app.listen(3333, () => console.log('Server is running'));
