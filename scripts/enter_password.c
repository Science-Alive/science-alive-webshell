#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>

int main(int argc, char *argv[]) {
    //Check if the player actually provided a password
    if (argc < 2) {
        printf("Wrong password. The door remains tightly shut.\n");
        return 1;
    }

    //Check the password safely
    if (strcmp(argv[1], "45A#6") == 0) {    //if basic password correct
        printf("Correct password! You hear a heavy stone mechanism grinding...\n");

        if (rmdir("locked_door") != 0) {
            perror("Error removing old door");
        }

        if (mkdir("unlocked_door", 0755) == 0) {
            printf("The door is now open.\n");

            FILE *chest = fopen("unlocked_door/treasure.txt", "w");
            if (chest != NULL) {
                fprintf(chest, "***********************************************\n");
                fprintf(chest, "* You open the huge stone door and find a room full of gold. *\n");
                fprintf(chest, "* The piles of gold reach up to the ceiling.*\n");
                fprintf(chest, "* It would take you hundreds of trips to get all this gold out of the maze.*\n");
                fprintf(chest, "* Congratulations you found the treasure!!!*\n");
                fprintf(chest, "***********************************************\n");
                fclose(chest);
            } else {
                perror("The treasure chest failed to spawn");
            }

            FILE *note = fopen("unlocked_door/.secret_note.txt", "w");
            if (note != NULL) {
                fprintf(note, "=== SECRET NOTE ===\n");
                fprintf(note, "There are still more secrete left to find using la -a.\n");
                fprintf(note, "Go to the barn, I have hidden instructions there.\n");
                fclose(note);
            } else {
                perror("The secret note failed to spawn");
            }

        } else {
            perror("Error creating the new passage");
        }
    }
    else if(strcmp(argv[1], "reset") == 0){  //reset the door
        if(remove("unlocked_door/treasure.txt") != 0){
            perror("Error removing treasure");
        }
        //the hidden note must go too, otherwise the directory is not empty
        if(remove("unlocked_door/.secret_note.txt") != 0){
            perror("Error removing secret note");
        }
        if (rmdir("unlocked_door") != 0) {
            perror("Error removing old door");
        }

        if (mkdir("locked_door", 0000) == 0) {
            printf("The door is locked again.\n");
        } else {
            perror("Error creating the new passage");
        }
    } 
    else {
        printf("Wrong password. The door remains tightly shut.\n");
    }

    return 0;
}