/**
 * About selfserve_music.js
 * 
 * This script all the backend logic and building of a basic audio streaming/playing service.
 */

selfserve.music = {
    availablePlayers: [] /* Players currently in use */
}

function AudioInfo(artist, songTitle, album, albumArtUrl)
{
    this.artist = artist;
    this.songTitle = songTitle;
    this.album = album;
    this.albumArtUrl = albumArtUrl;
}

function MusicPlayer(url, playerMarkup, audioInfo)
{
    this.url = url;
    this.playerMarkup = playerMarkup;
    this.audioInfo = audioInfo;
}

/**
 * @param url   The url to use as the audio's source.
 * @param @type AudioInfo
 * @param JQuery object (where to put it)
 * @returns An @function MusicPlayer object.
 * @throws  Throws if the URL is invalid or undefined/empty.
 */
selfserve.music.init = (url, audioInfo, parent) => {
    if($.trim(url) && selfserve.global.urlValid(url))
    {
        let playerMarkup = $("<audio></audio>").prop("controls", undefined).prop("src", url).html("Your browser doesn't support the audio element. :(");
        let divMarkup = $("<div></div>").prop("id", "music_player");

        /** TODO: can this be read from a file? */
        let infoDisplay = $(`<img src='${audioInfo.albumArtUrl}'></img>`)
                            .insertAfter(
                                $(`<h5>${audioInfo.songTitle}</h5>`).insertAfter($(`<h5>${audioInfo.artist}</h5>`)).insertAfter(`<h5>${audioInfo.album}</h5>`)
                            );
        
        let musicPlayer = new MusicPlayer(url, playerMarkup, audioInfo);

        let final = $(divMarkup).html(infoDisplay, playerMarkup);

        if(parent == undefined) $(body).insertAfter(final);
        selfserve.music.availablePlayers.push(musicPlayer)

        return musicPlayer;
    }
    else
        throw {error: "The URL was invalid.", argument: [url], value: url}
};