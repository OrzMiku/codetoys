#include <stdio.h>
#define DA_IMPLEMENTATION
#include "da.h"

typedef struct {
  float x, y, z;
} Vec3;

int main() {
  int *int_arr = NULL;
  da_push(int_arr, 1);
  da_push(int_arr, 3);
  da_push(int_arr, 2);
  for (size_t i = 0; i < da_len(int_arr); i++) {
    printf("%zu: %d\n", i, int_arr[i]);
  }

  Vec3 *vec3_arr = NULL;
  Vec3 p1 = { 1.0f, 0.0f, 0.0f };
  Vec3 p2 = { 0.0f, 1.0f, 0.0f };
  Vec3 p3 = { 0.0f, 0.0f, 1.0f };
  da_push(vec3_arr, p1);
  da_push(vec3_arr, p2);
  da_push(vec3_arr, p3);
  for (size_t i = 0; i < da_len(vec3_arr); i++) {
    printf("%zu: (%.2f, %.2f, %.2f)\n", i, vec3_arr[i].x, vec3_arr[i].y, vec3_arr[i].z);
  }
  return 0;
}
