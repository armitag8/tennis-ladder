import React, { Component } from "react";
import config from "../config";
import EmailCaptcha from "./EmailCaptcha";

class About extends Component {

    render() {
        return (
            <div className="about">
                <h1>Welcome to the Tennis Ladder</h1>
                <h2>Mission</h2>
                <p>
                    The objectives are to have fun and meet people to play with.
                    We welcome players of all skill levels.
                </p>
                <h2>Commitment</h2>
                <p>
                    By signing up for this ladder, you are committing to
                    finding time to play at least one match per week.
                    This is only fair to the other players in the ladder.
                </p>
                <p>
                    Usually, two matches are scheduled for each player each week,
                    but your ranking will only be affected negatively if you play neither.
                    Expect matches to be scheduled automatically against the players 
                    immediately above and below you in the Ranking on Monday mornings.
                </p>
                <h2>How to Join</h2>
                <p>
                    Ask a court supervisor at {config.club} or contact:
                </p>
                <EmailCaptcha />
                <p>
                    This ladder can only be joined by invitation, in order to protect your data
                    on the web. Invitations are typically granted for any members (or paying guests)
                    of <a href={config.clubSite}>{config.club}</a>.
                </p>
                <h2>Match Structure</h2>
                <p>
                    "Matches" are played as pro-sets until a winning score of at least 8 games.
                    Someone must win by two games. Ties of 8-8 are broken by tie-break games: played
                    until someone scores 10 points (again, first to win by 2).
                    Examples of final scores are therefore:
                </p>
                <ul>
                    <li>8-0</li>
                    <li>8-6</li>
                    <li>9-7</li>
                    <li>8-8, then tie-break: 10-8</li>
                    <li>8-8, then tie-break: 15-13</li>
                </ul>
                <h2>Using this Website</h2>
                <p>
                    Once you have received an invitation via email, click the link in the email.
                    You can now create your account on the Login tab. Use the same email address
                    from which you accepted the invitation and fill in the rest of the Sign Up form.
                </p>
                <p>
                    After you're logged in, you can view your position on the ladder in the Ranking
                    tab and any of your scheduled or past matches in the Matches tab.
                </p>
                <h3>
                    Scheduled Matches
                </h3>
                <p>
                    Each week, you should get an email or two about a match being scheduled between
                    you and another player. Please contact that other player as soon as possible to
                    arrange a time to play your match.
                </p>
                <h3>
                    Recording a Match Score
                </h3>
                <p>
                    After completing a match, one player should log onto the website and 
                    record the score, from either of the Matches or Ranking tabs. Click/tap
                    the sliders on the left of any other player's name and position to begin 
                    adding a match score.
                </p>
                <p>
                    You will not be able to play a match twice against the same player within
                    the same week (Monday - Sunday).
                </p>
                <h3>
                    Challenges and Impromptu Matches
                </h3>
                <p>
                    At any time, anyone at any position in the ladder may ask another player to 
                    play a match. This could be done through the website, via email or in person.
                    Players are under no obligation to accept these challenges, but the scores do
                    count towards your ranking. Please record the score the same way as with a
                    scheduled game.
                </p>
            </div>
        );
    }
}

export default About;
