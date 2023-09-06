import tensorflow as tf
import os
import json

def train_model(x_train, y_train, x_val, y_val):
    print("Creating the model...")

    model = tf.keras.Sequential()

    model.add(
        tf.keras.layers.Dense(
            units=256,
            activation="relu",
            input_shape=(x_train.shape[1],)
        )
    )

    model.add(tf.keras.layers.Dropout(0.2))
    model.add(tf.keras.layers.Dropout(0.2))

    model.add(
        tf.keras.layers.Dense(units=x_train.shape[1], activation="sigmoid")
    )

    print("Compiling the model...")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(0.0001),
        loss="mean_squared_error"
    )

    print("Training the model...")
    history = model.fit(
        x_train, y_train,
        epochs=50,
        batch_size=10,
        validation_data=(x_val, y_val)
    )

    print("Training complete!")
    print("History Object:", history.history)
    print("Epochs:", history.epoch[-1])
    print("Last Loss Value:", history.history['loss'][-1])

    model.save("../public/anime-recommender")
    print("Model saved to ./public/anime-recommender.")

def read_file():
    print("Reading the dataset...")
    with open('../public/hotEncodedAnime.json', 'r') as f:
        data = json.load(f)
    return data

if __name__ == "__main__":
    anime_data = read_file()

    features = [
        [
            *d['hotEncodedGenres'],
            d['ageRating'],
            d['score'],
            d['normalizedEpisodes'],
            d['normalizedRank'],
            d['normalizedPopularity']
        ] for d in anime_data
    ]

    data_tensors = tf.stack(features)

    split_idx1 = int(len(features) * 0.8)
    split_idx2 = int(len(features) * 0.9)

    x_train = data_tensors[:split_idx1]
    x_val = data_tensors[split_idx1:split_idx2]
    x_test = data_tensors[split_idx2:]

    y_train = tf.identity(x_train)
    y_val = tf.identity(x_val)
    y_test = tf.identity(x_test)

    print(f"Training set size: {x_train.shape[0]}")
    print(f"Validation set size: {x_val.shape[0]}")
    print(f"Test set size: {x_test.shape[0]}")

    train_model(x_train, y_train, x_val, y_val)

