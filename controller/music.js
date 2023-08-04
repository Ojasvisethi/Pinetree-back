const GenreOrArtist = require("../models/genreOrArtist");
const Music = require("../models/music");
const {
  putObjectAudio,
  getObjectUrlFromCloudFront,
} = require("../s3bucket/s3functions");

exports.upload = async (req, res) => {
  try {
    // console.log(req.body);
    const { audio, title, genre, artist } = req.body;
    if (!audio || !title || !genre || !artist) {
      // console.log(audio, title, genre);
      res.status(400).send("Missing image or audio data");
      return;
    }
    const music = new Music({
      title: title,
      songname: audio.name,
      genre: genre,
      artist: artist,
    });

    await music.save();

    const audioPresignedUrl = await putObjectAudio(
      audio.name,
      audio.contentType
    );

    const presignedUrls = {
      audio: {
        url: audioPresignedUrl,
        filename: audio.name,
      },
    };
    // console.log(presignedUrls);
    res.json(presignedUrls);
  } catch (error) {
    console.error("Error generating presigned URLs:", error);
    res.status(500).send("Error generating presigned URLs");
  }
};

exports.allMusic = async (req, res, next) => {
  try {
    const music = await Music.find();
    // console.log(signedUrls);
    res.json(music);
  } catch (error) {
    next(error);
  }
};

// exports.getMusic = async (req, res) => {
//   try {
//     console.log(req.params); // Destructure the name from req.params
//     const name = req.params.name;
//     const key = "audioFiles/" + name; // Add "audioFiles/" prefix back
//     const url = await getObjectUrl(key);
//     console.log(url);

//     // Return the URL as a response
//     res.json(url);
//   } catch (error) {
//     console.error("Error generating signed URL:", error);
//     res.status(500).send("Error generating signed URL");
//   }
// };

exports.getMusic = async (req, res) => {
  try {
    // console.log(req.params); // Destructure the name from req.params
    const name = req.params.name;
    const key = "audioFiles/" + name; // Add "audioFiles/" prefix back
    const url = await getObjectUrlFromCloudFront(key);
    // console.log(url);
    res.json(url);
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).send("Error generating signed URL");
  }
};

const PAGE_SIZE = 6; // Set the page size as per your requirement

exports.getSongs = async (req, res) => {
  // console.log(req.query);
  const { search, field, page, name } = req.query;
  const currentPage = parseInt(page, 10) || 0; // Parse the current page from the request query (default to 0)

  try {
    let query = {};
    // If search parameter is provided, use it to filter the results
    // console.log(search);
    const regex = new RegExp(search, "i");
    const nameRegex = new RegExp(name, "i");
    if (search) {
      // Create a regex pattern to perform a case-insensitive search

      // Use the field parameter to decide which fields to search
      if (field === "title") {
        query = { title: { $regex: regex } };
      } else if (field === "artist") {
        // console.log(name);
        if (name !== "undefined") {
          query = { artist: { $regex: nameRegex } };
          query = {
            $and: [
              { artist: { $regex: nameRegex } },
              { title: { $regex: regex } },
            ],
          };
          // console.log(query, "hiii");
        } else {
          query = { artist: { $regex: regex } };
          // console.log(query, "hi");
        }
      } else if (field === "genre") {
        // When the field is "genre," use "name" to search within the "genre" field
        query = query = {
          $and: [
            { genre: { $regex: nameRegex } },
            { title: { $regex: regex } },
          ],
        };
      } else {
        // If field is not provided or not valid, search in both Name and Artist fields
        query = {
          $or: [{ title: { $regex: regex } }, { artist: { $regex: regex } }],
        };
      }
    } else {
      if (field === "artist") {
        if (name !== "undefined") {
          query = { artist: { $regex: nameRegex } };
          // console.log(query, "hii", name);
        } else {
          // console.log(query, "hi");
          query = { artist: { $regex: regex } };
        }
      } else if (field === "genre") {
        // When the field is "genre," use "name" to search within the "genre" field
        if (name !== "undefined") {
          query = { genre: { $regex: nameRegex } };
        }
      }
    }
    // console.log(query);
    const totalSongs = await Music.countDocuments(query);
    const songs = await Music.find(query)
      .skip(currentPage * PAGE_SIZE)
      .limit(PAGE_SIZE);
    // console.log(songs);
    res.status(200).json({
      songs,
      totalSongs,
      hasMore: currentPage * PAGE_SIZE + songs.length < totalSongs,
    });
  } catch (error) {
    console.error("Error fetching songs:", error);
    res.status(500).json({ error: "Error fetching songs" });
  }
};

exports.disable = async (req, res) => {
  try {
    const { songIds } = req.body; // Extract songIds from the request body

    // Implement your logic to disable the songs based on the songIds
    // For example, you can update the songs in the database to mark them as disabled

    // Assuming you have a "disabled" field in the Song model to mark a song as disabled
    const songsToUpdate = await Music.find({ _id: { $in: songIds } });

    // Update each song's disabled field to its opposite value
    songsToUpdate.forEach(async (song) => {
      song.isDisabled = true;
      await song.save(); // Save the updated song in the database
    });

    // Send a success response
    res.status(200).json({ message: "Songs disabled successfully." });
  } catch (error) {
    // Handle errors
    // console.log(error);
    res.status(500).json({ error: "Error disabling songs." });
  }
};
exports.enable = async (req, res) => {
  try {
    const { songIds } = req.body; // Extract songIds from the request body
    const songsToUpdate = await Music.find({ _id: { $in: songIds } });
    songsToUpdate.forEach(async (song) => {
      song.isDisabled = false;
      await song.save();
    });

    // Send a success response
    res.status(200).json({ message: "Songs enabled successfully." });
  } catch (error) {
    // Handle errors
    // console.log(error);
    res.status(500).json({ error: "Error enabling songs." });
  }
};

exports.getGenreAndArtist = async (req, res) => {
  const limit = parseInt(req.query.limit);
  const query = req.query.GenOrArtsearch; // Parse the limit to an integer

  try {
    // If the query parameter is provided, use it to search for genres and artists separately
    let genres;
    let artists;

    const queryConditions = { isDisabled: false }; // Filter out documents with isDisabled: true

    if (query) {
      const regexQuery = new RegExp(query, "i");

      genres = await GenreOrArtist.find({
        type: "genre",
        name: { $regex: regexQuery },
        ...queryConditions, // Apply the isDisabled filter
      })
        .sort({ name: 1 }) // Sort in ascending order based on the name field
        .limit(limit);

      artists = await GenreOrArtist.find({
        type: "artist",
        name: { $regex: regexQuery },
        ...queryConditions, // Apply the isDisabled filter
      })
        .sort({ name: 1 }) // Sort in ascending order based on the name field
        .limit(limit);
    } else {
      // If no query parameter is provided, fetch all genres and artists
      genres = await GenreOrArtist.find({
        type: "genre",
        ...queryConditions,
      }).limit(limit);
      artists = await GenreOrArtist.find({
        type: "artist",
        ...queryConditions,
      }).limit(limit);
    }

    res.status(200).json({ genres, artists });
  } catch (error) {
    // Handle errors
    // console.log(error);
    res.status(500).json({ error: "Error fetching genres and artists." });
  }
};

exports.addGenreOrArtist = async (req, res) => {
  const type = req.body.type;
  const name = req.body.name;

  try {
    // Check if the name with the same type already exists
    const existingEntry = await GenreOrArtist.findOne({
      type: type,
      name: name,
    });

    if (existingEntry) {
      // Name with the same type already exists
      return res.status(409).json({ error: "Name already exists." });
    }

    // Name is unique, save the new GenreOrArtist
    const data = new GenreOrArtist({
      type: type,
      name: name,
    });

    await data.save();
    res.status(201).json({ message: "Genre or Artist added successfully." });
  } catch (error) {
    // Handle errors
    // console.log(error);
    res.status(500).json({ error: "Error adding Genre or Artist." });
  }
};

exports.disableArt = async (req, res) => {
  // console.log(req.body);
  const artist = req.body.ArtistIds;

  try {
    // Find songs with the matching artist name and toggle the isDisabled field
    const songs = await Music.find({ artist: { $in: artist } });
    for (const song of songs) {
      song.isDisabled = true;
      await song.save();
    }

    // Find artists with the matching artistIds and toggle the isDisabled field
    const artists = await GenreOrArtist.find({ name: { $in: artist } });
    for (const artist of artists) {
      artist.isDisabled = true;
      await artist.save();
    }

    res.status(200).json({ message: "Songs and artists toggled successfully" });
  } catch (error) {
    throw new Error("Error toggling songs and artists");
  }
};
exports.enableArt = async (req, res) => {
  // console.log(req.body);
  const artist = req.body.ArtistIds;

  try {
    // Find songs with the matching artist name and toggle the isDisabled field
    const songs = await Music.find({ artist: { $in: artist } });
    for (const song of songs) {
      song.isDisabled = false;
      await song.save();
    }

    // Find artists with the matching artistIds and toggle the isDisabled field
    const artists = await GenreOrArtist.find({ name: { $in: artist } });
    for (const artist of artists) {
      artist.isDisabled = false;
      await artist.save();
    }

    res.status(200).json({ message: "Songs and artists toggled successfully" });
  } catch (error) {
    throw new Error("Error toggling songs and artists");
  }
};
