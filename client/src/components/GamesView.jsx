import React, { Component } from 'react';
import '../style/GamesView.css';
import PlayerRow from "./PlayerRow";
import Button from "./Button";

class GamesView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            scheduledGames: [],
            pastGames: [],
        };
    }
    componentDidMount = () => this.props.user ? this.getScheduledGames() : this.props.logout();

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    getScheduledGames = () => 
        fetch("/api/games/scheduled/" + this.props.user)
        .then(response => {
            if (response.status === 200)
                response.json().then(games => this.setState({ scheduledGames: games }));
            else if (response.status === 401) 
                this.props.logout();
            else 
                console.log(response);
        })
        .catch(console.log);

    render() {
        return (
            <div className="games">
                <section>
                    <h2>Upcoming Games</h2>
                    {this.state.scheduledGames.map(player => 
                        <PlayerRow 
                            user={this.props.user}
                            key={player._id} 
                            _id={player._id}
                            position={player.position}
                            firstname={player.firstname}
                            lastname={player.lastname}
                            wins={player.wins}
                            losses={player.losses}
                            player1={player.player1}
                            player2={player.player2}
                            score={player.score}
                            updatePlayers={this.getScheduledGames}
                            onError={this.props.onError}
                        />)}
                </section>
                <section>
                    <h2>Past Games</h2>
                    <form className="game-search">
                        <div className="search-box">
                            <input type="search" placeholder="Search for games"/>
                        </div>
                        <Button icon="icono-search"/>
                    </form>
                    {this.state.pastGames.map(game => 
                        <GameRecord 
                            key={game._id} 
                            _id={game._id}
                            player1={game.player1}
                            player2={game.player2}
                            score={game.score}
                        />)}
                </section>
            </div>
        );
    }
}

class GameRecord extends Component {
    render() {
        return <div className="game-record">
        <div>    
            Week: {this.props.week}
        </div>
        <div>
            Opponent: {this.props.player1}
        </div>
    </div>;
    }
}

export default GamesView;