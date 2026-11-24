package com.cinema.cinema_backend.service;

import com.cinema.cinema_backend.exception.InvalidPosterException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.cinema.cinema_backend.exception.ResourceNotFoundException;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;

import java.nio.file.LinkOption;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.MemoryCacheImageInputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Iterator;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class MoviePosterStorage {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(MoviePosterStorage.class);

    private static final String URL_PREFIX = "/api/movie-posters/";
    private static final Pattern MANAGED_FILE_NAME = Pattern.compile(
            "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.jpg"
    );
    private static final long MAX_PIXELS = 12_000_000L;

    private final Path directory;

    public MoviePosterStorage(
            @Value("${app.movie.poster-directory}") String posterDirectory
    ) {
        this.directory = Path.of(posterDirectory).toAbsolutePath().normalize();
    }

    public String store(MultipartFile file) {
        BufferedImage image = toRgb(readPoster(file));
        String fileName = UUID.randomUUID() + ".jpg";
        Path temporaryFile = null;

        try {
            Files.createDirectories(directory);
            temporaryFile = Files.createTempFile(directory, ".poster-", ".tmp");

            if (!ImageIO.write(image, "jpeg", temporaryFile.toFile())) {
                throw new IOException("No JPEG writer is available.");
            }

            Files.move(temporaryFile, directory.resolve(fileName));
            return URL_PREFIX + fileName;
        } catch (IOException exception) {
            throw new UncheckedIOException("Unable to store the movie poster.", exception);
        } finally {
            if (temporaryFile != null) {
                deleteQuietly(temporaryFile);
            }
        }
    }

    public Resource load(String fileName) {
        if (!MANAGED_FILE_NAME.matcher(fileName).matches()) {
            throw new ResourceNotFoundException("Poster not found.");
        }

        Path file = directory.resolve(fileName);

        if (!Files.isRegularFile(file, LinkOption.NOFOLLOW_LINKS)) {
            throw new ResourceNotFoundException("Poster not found.");
        }

        return new FileSystemResource(file);
    }

    public void deleteIfManaged(String posterUrl) {
        if (posterUrl == null || !posterUrl.startsWith(URL_PREFIX)) {
            return;
        }

        String fileName = posterUrl.substring(URL_PREFIX.length());

        if (MANAGED_FILE_NAME.matcher(fileName).matches()) {
            deleteQuietly(directory.resolve(fileName));
        }
    }

    private static BufferedImage readPoster(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidPosterException("Select a poster image.");
        }

        try (InputStream input = file.getInputStream();
             var imageInput = new MemoryCacheImageInputStream(input)) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(imageInput);

            if (!readers.hasNext()) {
                throw new InvalidPosterException("Poster must be a JPEG or PNG image.");
            }

            ImageReader reader = readers.next();

            try {
                String format = reader.getFormatName();

                if (!"JPEG".equalsIgnoreCase(format) && !"PNG".equalsIgnoreCase(format)) {
                    throw new InvalidPosterException("Poster must be a JPEG or PNG image.");
                }

                reader.setInput(imageInput, true, true);
                long pixels = (long) reader.getWidth(0) * reader.getHeight(0);

                if (pixels > MAX_PIXELS) {
                    throw new InvalidPosterException("Poster must not exceed 12 megapixels.");
                }

                return reader.read(0);
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new InvalidPosterException("The poster image could not be read.", exception);
        }
    }

    private static BufferedImage toRgb(BufferedImage source) {
        BufferedImage image = new BufferedImage(
                source.getWidth(), source.getHeight(), BufferedImage.TYPE_INT_RGB
        );

        Graphics2D graphics = image.createGraphics();

        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
            graphics.drawImage(source, 0, 0, null);
        } finally {
            graphics.dispose();
        }

        return image;
    }

    private static void deleteQuietly(Path file) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            LOGGER.warn("Unable to remove poster file {}", file.getFileName(), exception);
        }
    }
}