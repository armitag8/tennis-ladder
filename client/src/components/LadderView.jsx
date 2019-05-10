import React, { Component } from 'react';
import '../style/LadderView.css';
import Button from "./Button";

class LadderView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            _id: "",
            page: 0,
            week: 1,
            players: []
        };
    }

    onUpdate = (event) => {
        let newState = {}
        newState[event.target.name] = event.target.value;
        this.setState(newState, this.validate);
    }

    updatePlayers = () => 
        fetch("/api/week/" + this.state.week)
        .then(response => response.json().then(users => this.setState({ players: users })))
        .catch(console.log);

    componentDidMount = this.updatePlayers;

    render() {
        return (<div>
            <div className="row-bar">
                <Button icon="icono-caretLeft" />
                <h2>Rankings: Week {this.state.week} </h2>
                <Button icon="icono-caretRight" />
            </div>
            {this.state.players.map(player => 
                <PlayerRow 
                    key={player._id} 
                    _id={player._id}
                    position={player.position}
                    firstname={player.firstname}
                    lastname={player.lastname}
                    wins={player.wins}
                    losses={player.losses}
                />)}
        </div>);
    }
}

class PlayerRow extends Component {
    render() {
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        return (<div className="row-bar" >
                <h1 className="btn">{this.props.position}</h1>
                <h3>{this.props.firstname} {this.props.lastname}</h3>
                <div>Wins: {this.props.wins}</div>
                <div>Losses: {this.props.losses}</div>
                
                <Button 
                    icon="icono-mail" 
                    onClick={() => window.open("mailto:" + this.props._id)}
                />
            </div>);
    }
}

export default LadderView;