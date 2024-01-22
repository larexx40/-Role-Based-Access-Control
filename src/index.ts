import app from "./Config/app";
import { db } from "./Config/db.config";
import roleRouter from "./Routes/roles";
import userRouter from "./Routes/users";
import environment from "./environment";


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", roleRouter);

const PORT = environment.getPort() || 5000;

db.then(() => {
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});