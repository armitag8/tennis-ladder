import React, { Component } from "react";
import config from "../config.json";
import ReCAPTCHA from "react-google-recaptcha";

class EmailCaptcha extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: null,
            email: "Hi"
        };
    }

    render = () => (
        <form>
            <ReCAPTCHA
                style={{ display: this.state.value ? "none" : "block" }}
                sitekey="6Lc8zKQUAAAAAJ4VwPZgJzm1eF-PXgM5dSAaWwTs"
                onChange={value => this.setState({ value: value })}
            />
            {this.state.value === null ? null : <a href={`mailto:${config.admin}`}>{config.owner}</a>}
        </form>
    );
}

export default EmailCaptcha;