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
    componentDidMount = () => this.props.user ? this.reload() : this.props.logout();

    reload = () => this.getGames("scheduled") && this.getGames("past");

    

    getGames = which =>
        fetch(`/api/games/${which}/${this.props.user}`)
            .then(response => {
                if (response.status === 200)
                    response.json().then(games => this.setState(() => {
                        let newState = {};
                        newState[`${which}Games`] = games;
                        return newState;
                    }));
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
                    <h2>Upcoming Matches</h2>
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
                            updatePlayers={this.reload}
                            onError={this.props.onError}
                        />)}
                </section>
                <section>
                    <h2>Past Matches</h2>
                    {/*
                    <form className="game-search">
                        <div className="search-box">
                            <input type="search" placeholder="Search for past matches" />
                        </div>
                        <Button icon="icono-search" />
                    </form>
                    */}
                    <div className="past-games">
                        <div className="past-games-column-headers">
                            <div className="week">Week</div>
                            <div className="opponent">Opponent</div>
                            <div className="result">Result</div>
                            <div className="score">Score</div>
                        </div>
                        {this.state.pastGames.map(game =>
                            <GameRecord
                                key={game._id}
                                week={game.week}
                                opponent={game.opponent}
                                score={game.score}
                                win={game.win}
                            />)}
                    </div>
                </section>
            </div>
        );
    }
}

class GameRecord extends Component {
    render() {
        return <div className="game-record">
            <div className="week">
                {this.props.week.toString()}
            </div>
            <div className="opponent">
                {this.props.opponent.firstname + " " + this.props.opponent.lastname}
            </div>
            <div className="result">
                {this.props.win ? "Win" : "Loss"}
            </div>
            <div className="score">
                {this.props.score.slice(0, 2).join("-")}
                {this.props.score.length < 3 ? null : 
                    `, ${this.props.score.slice(2).join("-")}`}
            </div>
        </div>;
    }
}

export default GamesView;