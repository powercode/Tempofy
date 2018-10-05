import React from 'react';
import { connect } from 'react-redux'
import { compose, withHandlers, lifecycle, mapProps, withState } from 'recompose'
import { ScrollView, StyleSheet, View, SafeAreaView } from 'react-native';
import { ListItem, Text, Button } from 'react-native-elements';
import withSpotify from '../utils/spotify'
import { spinnerWhileLoading, shuffleArray } from '../utils'
import NowPlayingBar from '../components/NowPlayingBar'
import TempoFilter from '../components/TempoFilter'
import PlatformIcon from '../components/PlatformIcon';
import actionTypes from '../constants'

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});

const TrackScreen = ({tracks, filteredTracks, error, onPress, onPressShuffle, onPressNowPlaying, onRefresh, filterTracks}) => (
  <SafeAreaView style={styles.container}>
    {error &&
      <View>
        <Text h4>{error}</Text>
      </View>
    }
    {filteredTracks &&
      <View>
        <TempoFilter tracks={tracks} onFilterTracks={(value) => filterTracks(tracks, value)}/>
        <Button title="Play Shuffle" onPress={() => onPressShuffle(filteredTracks)}/>
      </View>
    }
    <ScrollView>
      {
        filteredTracks.map((item, i) => (
          <ListItem
            key={i}
            onPress={() => onPress(item)}
            title={item.track.name}
            leftIcon={item.isPlaying ? <PlatformIcon size={26} shortName={'musical-notes'} style={styles.rightIcon}/> : null}
            badge={item.tempo ? { value: parseInt(item.tempo) } : null}
          />
        ))
      }
    </ScrollView>
    <NowPlayingBar onPress={() => onPressNowPlaying()}/>
  </SafeAreaView>
)

export default compose(
  withSpotify,
  connect(({spotify, player, data}) => ({
    tracks: data.tracks,
    filteredTracks: data.filteredTracks,
    error: spotify.error,
    player: player.playerState
  })),
  withHandlers({
    onPress: ({spotify, navigation}) => (item) => {
      spotify.playTrack(item.track.uri)
      navigation.navigate('Fullscreen')
    },
    onPressShuffle: ({spotify, navigation}) => (filteredTracks) => {
      const shuffledArray = shuffleArray(filteredTracks)
      spotify.playTrack(shuffledArray[0].track.uri)
      navigation.navigate('Fullscreen')
    },
    onPressNowPlaying: ({navigation}) => () => {
      navigation.navigate('Fullscreen')
    },
    filterTracks: props => (tracks, tempo) => {
      var filteredTracks = tracks
      if(tempo) {
        filteredTracks = filteredTracks.filter(track => {
          const minTempo = tempo
          const maxTempo = minTempo + 5
          return (track.tempo > minTempo) && (track.tempo < maxTempo)
        })
      }
      props.dispatch({ type: actionTypes.SET, path: 'filteredTracks', data: filteredTracks })
      props.dispatch({ type: actionTypes.SET, path: 'tempoSelected', data: tempo })
    }
  }),
  lifecycle({
    componentDidMount() {
      this.props.spotify.getPlaylistTracks(this.props.navigation.state.params.playlistId)
    }
  }),
  mapProps(props => {
    var tracks = []
    if(props.tracks && props.player) {
      tracks = props.tracks.map(item => {
        item.isPlaying = props.player.uri === item.track.uri
        return item
      })
    }
    //const filteredTracks = props.filteredTracks ? props.filteredTracks : []
    return {
      ...props,
      tracks
    }
  }),
  spinnerWhileLoading(['tracks', 'filteredTracks'])
)(TrackScreen)
