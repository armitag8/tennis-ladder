import React, { Component } from 'react';
import '../style/LadderView.css';
import PlayerRow from "./PlayerRow";

const withInfiniteScroll = (Component) =>
    class WithInfiniteScroll extends React.Component {
        componentDidMount() {
            window.addEventListener('scroll', this.onScroll, false);
        }

        componentWillUnmount() {
            window.removeEventListener('scroll', this.onScroll, false);
        }

        onScroll = () => {
            if (
                (window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 500) &&
                this.props.players.length
            ) {
                this.props.onNextPage();
            }
        }

        render() {
            return <Component {...this.props} />;
        }
    }


class Ladder extends Component {
    render = () => (
        <div>
            {this.props.players.map(player =>
                <PlayerRow
                    user={this.props.user}
                    key={player._id}
                    _id={player._id}
                    position={player.position}
                    firstname={player.firstname}
                    lastname={player.lastname}
                    wins={player.wins}
                    losses={player.losses}
                    updatePlayers={this.props.updatePlayers}
                    onError={this.props.onError}
                />)}
        </div>
    );
}

const InfiniteLadder = withInfiniteScroll(Ladder);

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: "",
            week: 1,
            players: [],
            page: 0,
            loading: false
        };
    }

    getPage = page => this.setState({loading: true}, () => fetch(`/api/user/?page=${page}`)
        .then(response => {
            if (response.status === 200)
                response.json().then(users => this.setState(state =>
                    ({ 
                        players: page === 0 ? users : state.players.concat(users),
                        page: page,
                        loading: false
                    })));
            else if (response.status === 401)
                this.props.logout();
            else
                this.setState({loading: false}, () => console.log(response));
        }).catch(console.log));

    updatePlayers = () => this.getPage(0);

    getNextPage = async () => await this.state.loading ? null : this.getPage(this.state.page + 1);

    componentDidMount = () => this.props.user ? this.updatePlayers() : this.props.logout();

    render = () => <InfiniteLadder
        user={this.props.user}
        players={this.state.players}
        updatePlayers={this.updatePlayers}
        onNextPage={this.getNextPage}
        onError={this.props.onError}
        loading={this.state.loading}
    />;
}



export default LadderView;