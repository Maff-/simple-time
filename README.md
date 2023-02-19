Simple Simplicate Time-logging tool (SSTt)
==========================================

Alternative way for [Simplicate] _time-logging_ with [Jira] issue integration.


## Goal & Features

This tool is intended as a 3rd party replacement for Simplicate's Chrome/Firefox browser extensions as a means of time-tracking.
It tries to improve usability and add some features not found in those extensions. All with the goal to make the boring
task of registering all spent time as fast and hassle-free as possible.

For this the tool has the following features:

* **Jira-integration**. Create a Jira worklog entry at the same time as registering the spent time at Simplicate. (Just like the browser extensions).
* **Project mapping**. Link Simplicate and Jira projects in a _many-to-many_ fashion. This will make it easier to find the exact Jira issue that you have been working on.
* **Fuzzy search**. Fuzzy search for issues, projects, services and hour types. Increases the chance of quickly finding and selecting option you're looking for. 
* **Auto service/type selection**. Automatically selects the only option, or falls back on a preferred configured option.
* **Smart time input**. Use any of the supported (not so strict) time formats; `2h 15m`, `2h15`, `2:15` or `2.25`. Or simply use the arrow keys, with or without modifier keys, to get to the desired duration.
* **Quickly add another entry**. Optionally keep project, service and type fields populated after entry submit.
* **Detailed daily overview**. Lists all logged hours for the chosen date, including links to the Jira issues and actions to delete/edit/import those records.
* **Delete, edit and import**. No need to log into Simplicate itself to fix mistakes. And ability to quickly use another entry as the basis for a new one.
* **Daily progress**. A progressbar indicates how many hours were logged that day, and how much is remaining.
* **Weekly summary**. Shows a per-project weekly sum of logged hours, as well as a grand total.
* **Week submit**. Submit all logged hours at the end of the week directly from the tool. No need to log into Simplicate itself.
* **Regular webpage**. Doesn't close and lose all data when you switch between tabs/programs to quickly look something up.
* **Keyboard shortcuts**. Quickly jump to the desired input field, switch between dates, submit and clear the form, etc.
* **Loads of settings**. Fine-tune the tool to your liking by enabling/disabling features and adjusting other options.


## Screenshot

![Time logging interface](/docs/screenshot.png)


## Building & Running the Tool

This tool is designed to be build and deployed for a single organization.
You'll have to configure your Simplicate domain and Jira instance address in an `.env.local` file.
After this the project can be build and the output of that process can than be served as static files.

```shell
yarn install
copy .env .env.local
# edit .env.local 
yarn build
# serve the 'dist' folder with your favourite web server
```

If you want to host the application at a sub-path, make sure to set the `BASE_URL` [environment variable] or `publicPath`
[configuration option] before running the build command.

See the Vue CLI [Deployment Guide](https://cli.vuejs.org/guide/deployment.html)
and [Configuration Reference](https://cli.vuejs.org/config/) for more information and additional options.

Because of _same site_ and _cross-origin_ limitations the tools should be served at the same domain name as Jira.
This can be a different subdomain though. (For example `jira.your-company.nl` and `simple-time.your-company.nl`).

Jira (or the httpd serving Jira) must be configured to send CORS headers.
See [docs/nginx-jira-proxy.conf](docs/nginx-jira-proxy.conf) for an example where nginx is used as a reverse proxy.


## Development

You can use `yarn serve` instead of `yarn build` to build and run the application with hot-reloading enabled.


## TODO / Wishlist / Known limitations

While this tools has been in use at the company since early 2022, there are still some things left to do;

* Because this tool is client-side only, CORS becomes a bit of a problem/hassle.
* Simplicate doesn't provide the ability to add a custom OAuth client (yet?).
  * In the meantime we are 'borrowing' the client id/secret from their Chrome plugin.
  * This makes the authorization process somewhat unusual.
  * Simplicate's authorization server does not support CORS headers (yet?). We have to use a custom proxy for the last step of the OAuth process!
* The http server serving Jira needs to be configured to serve CORS headers.
* Link Jira _worklog_ back to Simplicate entry (or the other way around)!! (A solution for this has been thought out, but is not implemented yet).
* Make Jira integration more optional.
* Support multiple Jira instances (mapped to Simplicate project?).
* Timers.
* Weekly hours target per project.
* Bulk edit. (To quickly fix wrong date, hour type, etc of multiple entries at once).
* Optional compact interface mode. (Use something like Stylebot and/or Tampermonkey in the meanwhile).
* Dark mode 😎.
* Technical improvements; refactor, abstraction, TypeScript, Vue3, ...
* See all TODOs and FIXMEs.


## Contributing

Feel free to open a [Github issue] when you found a bug or have a great idea for a new feature. But please keep in mind
I'm only occasionally working on the project in my spare time.

If you want to contribute some small improvements you may create a pull request, but I'll would suggest to get in touch
before staring to work on something more substantial. Please try to keep existing code style and unnecessary changes to
a minimum.

The permissive MIT license used allows you to create/run your own (private) fork and/or redistribute this project.
It would however be great if proper attribution is kept and changes beneficial to others are shared.


## Acknowledgments

This tool is built upon great open source projects, most notably [Vue], [Bootstrap] and [Vue Select].
Icons used are from [Bootstrap Icons]. [Axios] is used as a http client. [Fuse.js] helps with fuzzy-search.
Check the `package.json` file for the full up-to-date list of direct dependencies.

Many thanks to my colleagues for trying it out, and now using this tool daily. 💗


<!-- links & refs -->

[Simplicate]: https://www.simplicate.com/
[Jira]: https://www.atlassian.com/software/jira
[Vue]: https://vuejs.org/
[Bootstrap]: https://getbootstrap.com/
[Vue Select]: https://vue-select.org/
[Bootstrap Icons]: https://icons.getbootstrap.com/
[Axios]: https://axios-http.com/
[Fuse.js]: https://fusejs.io/
[Github issue]: https://github.com/Maff-/simple-time/issues
[environment variable]: https://cli.vuejs.org/guide/mode-and-env.html#using-env-variables-in-client-side-code
