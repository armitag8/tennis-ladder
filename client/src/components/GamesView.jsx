import React, { Component } from 'react';
import '../style/LadderView.css';
import NewGameForm from "./NewGameForm";
import Button from './Button';

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            games: []
        };
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    getGames = () => 
        fetch("/api/games/")
        .then(response => {
            if (response.status === 200)
                response.json().then(games => this.setState({ games: games }));
            else if (response.status === 401) 
                this.props.onLogout();
            else 
                console.log(response);
        })
        .catch(console.log);

    render() {
        return (
            <div>
                <section>
                    <h2>Upcoming Game</h2>
                </section>
                <section>
                    <h2>Add Game</h2>
                    <NewGameForm opponentName="Joe"/>
                </section>
                <section>
                    <h2>Past Games</h2>
                    <form className="game-search">
                        <input type="search" />
                        <Button icon="icono-search"/>
                    </form>
                    {this.state.games.map(game => 
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
        return (<div/>);
    }
}

export default LadderView;