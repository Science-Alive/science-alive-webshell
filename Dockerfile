FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    vim \
    less \
    tree \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create users and groups
RUN useradd -m -s /bin/bash student && \
    useradd -m -s /bin/bash goblin && \
    useradd -m -s /bin/bash wizard && \
    useradd -m -s /bin/bash troll && \
    groupadd heroes && \
    groupadd monsters && \
    usermod -aG monsters goblin && \
    usermod -aG monsters troll && \
    usermod -aG heroes wizard

RUN echo "Welcome! Try: ls, pwd, cd, mkdir, cat, echo, vim" > /home/student/README.txt

# ── Maze ──────────────────────────────────────────────────────────────────────
# The maze layout and all sign/note text live in the maze/ directory in this repo.
# Copying it in (rather than generating it with heredocs) keeps the text editable
# as plain files and works with any Docker builder. locked_door is created empty
# here because git does not track empty directories.
COPY maze/ /home/student/MAZE/
RUN mkdir -p /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/locked_door

# ── Ownership ────────────────────────────────────────────────────────────────
# Default the whole maze to student, then hand every sign/note to the wizard,
# then override the notes that belong to the monsters (goblin/troll).
RUN chown -R student:student /home/student/MAZE
RUN find /home/student/MAZE -name "*.txt" -exec chown wizard:heroes {} \;

RUN chown goblin:monsters /home/student/MAZE/entrance/right/narrow_cliff/goblin_den/note.txt
RUN chown goblin:monsters /home/student/MAZE/entrance/right/narrow_cliff/goblin_den/treasure_room/note.txt
RUN chown goblin:monsters /home/student/MAZE/entrance/right/narrow_cliff/goblin_den/armory/knife_note.txt

RUN chown wizard:heroes /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/box.txt

RUN chown troll:monsters /home/student/MAZE/entrance/left/up/field/barn/.trapdoor/box/note2.txt
RUN chown troll:monsters /home/student/MAZE/entrance/left/down/river/downstream/.secret_passage/message.txt
RUN chown troll:monsters /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/.portal_frame/note1.txt
RUN chown troll:monsters /home/student/MAZE/entrance/right/rope_swing/lake/deeper/ruins/.helmet.txt

# ── Password ────────────────────────────────────────────────────────────────
# The challenge binaries are compiled from source here (gcc is already installed
# above) so the .c files are the single source of truth and the binary always
# matches the image's platform.

# locked door
COPY scripts/enter_password.c /tmp/enter_password.c
RUN gcc /tmp/enter_password.c -o /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/enter_password && \
    rm /tmp/enter_password.c && \
    chown wizard:heroes /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/enter_password && \
    chmod 4711 /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/enter_password

# The SUID-wizard binary creates unlocked_door/ here, so the directory itself must
# be owned by wizard. Mode stays 755 so the student can still cd/list/run the binary.
RUN chown wizard:heroes /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel

RUN chmod 000 /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/locked_door
RUN chown wizard:heroes /home/student/MAZE/entrance/right/narrow_cliff/cavern/tunnel/locked_door

# portal
COPY scripts/enter_glyph.c /tmp/enter_glyph.c
RUN gcc /tmp/enter_glyph.c -o /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/.portal_frame/enter_glyph && \
    rm /tmp/enter_glyph.c && \
    chown wizard:heroes /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/.portal_frame/enter_glyph && \
    chmod 4711 /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/.portal_frame/enter_glyph

# The SUID-wizard binary creates activated_portal/ here, so the directory itself
# must be owned by wizard. Mode stays 755 so the student can still cd/list/run it.
RUN chown wizard:heroes /home/student/MAZE/entrance/left/down/river/upstream/mushroom_grove/.portal_frame

# ── Potions ────────────────────────────────────────────────────────────────
RUN mkdir -p /home/student/POTIONS/potions
COPY scripts/cauldron.c /home/student/POTIONS/cauldron.c
COPY scripts/recipe_book.txt /home/student/POTIONS/recipe_book.txt
RUN chown student:student /home/student/POTIONS && \
    chown student:student /home/student/POTIONS/potions && \
    chown wizard:heroes /home/student/POTIONS/cauldron.c && \
    chown wizard:heroes /home/student/POTIONS/recipe_book.txt


RUN chmod 777 /home/student/POTIONS/cauldron.c && \
    chmod 777 /home/student/POTIONS/recipe_book.txt

# ── Docker ────────────────────────────────────────────────────────────────
COPY scripts/startup.sh /startup.sh
RUN chmod +x /startup.sh

USER student
WORKDIR /home/student

CMD ["/startup.sh"]
