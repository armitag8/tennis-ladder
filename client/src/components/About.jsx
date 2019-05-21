import React, { Component } from "react";

class About extends Component{

    render(){
        return (
            <div className="about">
                <h2>Welcome to the Tennis Ladder</h2>
                <h3>Mission</h3>
                <p>
                    The objectives are to have fun and meet people to play with.
                    We welcome players of all skill levels.
                </p>
                <h3>Commitment</h3>
                <p>
                    By signing up for this ladder, you are committing to 
                    finding time to play at least one match per week. This is only
                    fair to the other players in the ladder.
                </p>
                <h3>Match Structure</h3>
                <p>
                    "Matches" are played as pro-sets up to 8 games. One must win by two games.
                    Ties of 8-8 are broken by tie-break games played to 10 points (first to win by 2).
                    Examples of final scores are therefore:
                </p>
                <ul>
                    <li>8-0</li>
                    <li>8-6</li>
                    <li>9-7</li>
                    <li>8-8, then tie-break: 10-8</li>
                    <li>8-8, then tie-break: 15-13</li>
                </ul>
                <h3>How to Join</h3>
                <p>
                    Contact <a href="mailto:joe.armitage@mail.utoronto.ca">Joe Armitage</a>, 
                    or come chat with a court supervisor at the tennis courts.
                </p>
            </div>
        );
    }
}

export default About;
