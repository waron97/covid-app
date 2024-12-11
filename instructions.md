## Homework
The Civil Protection Department released a [GitHub repository](https://github.com/pcm-dpc/COVID-19) containing epidemiological data, concerning the SARS-CoV-2 pandemic, gathered by the Italian regions. We are asking you to write a program in a language of your choice to perform the tasks you find here below.

### Rules of the game
You are free to search the Internet for help, and even ask hints to your friends and colleagues, just like you will in real life. Nevertheless, you should expect your code will be deeply scrutinized by your technical recruiter(s), and you will be held accountable for anything you submit, so ensure to be able to 1) explain and uphold the rationale of your technical choices; 2) explain the logical flow of your software in detail.

We expect your software to be production-grade level and bug-free. We also expect that your software will catch (at least some) invalid data entries and will mitigate the most basic attack vectors security-wise.

We don't expect that you will be able to complete all the tasks we are assigning you, so focus on delivering what you can at the best you can rather than trying to deliver all tasks with uncomplete, untested, bugged code.

Automated tests, comments, documentation and whatnot are not required but greatly appreciated. Variable names, comments, docs, commit messages and whatnot must be written in English.

Questions are an appreciated way to save time: feel free to get in touch with your recruiter(s) for any kind of questions or request for clarification you might need. You won't be judged if you don't understand a requirement, but you will if you have a doubt and you don't clarify it with us.

Please submit your work in a public Github repository purposely dedicated to this homework within the deadline your technical recruiter(s) has provided you. It's enough you drop them an email with your repository to the address they wrote you in the first place.

### Your evaluation
You will be evaluated according to a mix of criteria. Each one will have a different weight in your overall score. Some of the most important criteria are:
- delivering working code perfectly matching the requirements you have been provided;
- delivering idiomatic code is and exhibiting a good knowledge of the standard library of your language of choice;
- adopting the most appreciated and recommended design pattern of the language of your choice;
- applying the coding style rules of your language of choice;
- adding additional, unrequested features that increase the usability of your software;
- optimizing your code for time and space efficency;
- providing additional, unrequested assets like documentation and tests;
- properly using git and delivering a linear and clear commit history;

### Task #1
Write a web application that reads the data from the per-province JSON file available on the Github repository and stores them to a database. This application should be accessible through a browser and should show the grand total of cases (key "totali_casi" of the object regarding the province) aggregated by Italian region. The results must be sorted from the region with the highest number of cases to the region with the smallest number of cases (and in alphabetical order as secondary sorting). The data to be displayed must relate to the day the application is accessed by the browser.

### Task #2
Extend the software from task #1 adding a search functionality to fetch the data concerning any date from February 24th 2020 (the beginning of the historical series on Github) to today. The date can be provided to the software in any format you prefer.

### Task #3
Further extend the software with another option to export the data concerning either the current day or the date passed via the option from task #2 in an .xls file, on two different columns (region and total number of cases) in a single sheet.

### Task #4
Complete the software by adding the possibility to change sorting options from the web browser.
