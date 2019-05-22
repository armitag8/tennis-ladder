import React, { Component } from "react";
import config from "../config.json";

class EmailCaptcha extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: null,
            email: config.admin
        };
    }

    render = () => (
        <form>
            <a href={`mailto:${this.state.email}`}>{config.owner}</a>
        </form>
    );
}

export default EmailCaptcha;